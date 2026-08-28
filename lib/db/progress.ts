/**
 * Progress reads and writes.
 *
 * `lesson_progress` is the only table a student writes to directly; RLS scopes
 * every row to `auth.uid()`, so there is no user id to pass around.
 *
 * Completion is the product — `nextLesson` here is what powers the single
 * dashboard CTA, and getting it wrong is the difference between a student
 * resuming and a student drifting.
 */
import { createClient } from '@/lib/supabase/client';
import { config } from '@/config/flagskool.config';
import type { CourseProgress, LessonProgress, ModuleProgress } from '@/types/index';
import type { Db } from './client';
import { fetchCurriculum } from './curriculum';
import { fetchEntitledSkus } from './profile';

interface ProgressRow {
  lesson_id: string;
  position_seconds: number;
  completed_at: string | null;
}

/** The signed-in user's raw progress rows, keyed by lesson id. */
async function fetchProgressByLesson(db?: Db): Promise<Map<string, ProgressRow>> {
  const supabase = db ?? createClient();

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id, position_seconds, completed_at');

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.lesson_id, row]));
}

/**
 * Full course progress, including the next lesson to resume.
 *
 * "Next" is the first lesson, in curriculum order, that the student has not
 * completed *and* can actually open. Skipping the entitlement check here would
 * point the dashboard's only CTA at a locked lesson.
 */
export async function fetchCourseProgress(db?: Db): Promise<CourseProgress> {
  const [{ modules, moduleSkus }, progressByLesson, entitledSkus] =
    await Promise.all([
      fetchCurriculum(db),
      fetchProgressByLesson(db),
      fetchEntitledSkus(db),
    ]);

  const entitled = new Set(entitledSkus);
  const moduleProgress: ModuleProgress[] = [];
  let nextLesson: LessonProgress | null = null;
  let completedLessonsCount = 0;
  let totalLessonsCount = 0;

  for (const mod of modules) {
    const sku = moduleSkus.get(mod.id) ?? 'recordings';
    const isUnlocked = entitled.has(sku);
    let completedCount = 0;

    for (const [index, lesson] of mod.lessons.entries()) {
      totalLessonsCount += 1;
      const row = progressByLesson.get(lesson.id);
      const isCompleted = Boolean(row?.completed_at);

      if (isCompleted) {
        completedCount += 1;
        completedLessonsCount += 1;
        continue;
      }

      // A free preview is openable without an enrollment, so it is a valid
      // resume target even inside an otherwise locked module.
      const isOpenable = isUnlocked || lesson.isFree === true;
      if (nextLesson || !isOpenable) continue;

      const totalSeconds = lesson.durationMinutes * 60;
      const lastPositionSeconds = row?.position_seconds ?? 0;

      nextLesson = {
        lessonId: lesson.id,
        moduleId: mod.id,
        moduleNumber: mod.number,
        moduleTitle: mod.title,
        lessonNumber: index + 1,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        lastPositionSeconds,
        totalSeconds,
        percentComplete:
          totalSeconds > 0
            ? Math.round((lastPositionSeconds / totalSeconds) * 100)
            : 0,
        isCompleted: false,
      };
    }

    moduleProgress.push({
      moduleId: mod.id,
      moduleNumber: mod.number,
      title: mod.title,
      lessonCount: mod.lessons.length,
      completedCount,
      percentComplete:
        mod.lessons.length > 0
          ? Math.round((completedCount / mod.lessons.length) * 100)
          : 0,
      isUnlocked,
      upgradeTierId: isUnlocked ? undefined : 'cohort',
    });
  }

  return {
    completedLessonsCount,
    totalLessonsCount,
    percentComplete:
      totalLessonsCount > 0
        ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
        : 0,
    nextLesson,
    modules: moduleProgress,
  };
}

/**
 * Persist playback position, and auto-complete once the configured watched
 * fraction is passed.
 *
 * Upsert on (user_id, lesson_id) — the table carries a unique constraint on
 * that pair, so a reconnect flushing a queued write cannot create a duplicate.
 * `completed_at` is only ever set, never cleared here: rewinding a finished
 * lesson must not un-finish it.
 */
export async function saveLessonPosition(
  lessonId: string,
  positionSeconds: number,
  totalSeconds: number
): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const orgId = await fetchOrgId();
  if (!orgId) return;

  const reachedThreshold =
    totalSeconds > 0 &&
    (positionSeconds / totalSeconds) * 100 >= config.player.markCompleteAtPercent;

  const existing = await supabase
    .from('lesson_progress')
    .select('completed_at')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const alreadyComplete = Boolean(existing.data?.completed_at);
  const completedAt = alreadyComplete
    ? existing.data?.completed_at
    : reachedThreshold
      ? new Date().toISOString()
      : null;

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      org_id: orgId,
      user_id: user.id,
      lesson_id: lessonId,
      position_seconds: Math.max(0, Math.floor(positionSeconds)),
      completed_at: completedAt ?? null,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) throw error;
}

/** Explicit "Mark complete" / un-complete from the player. */
export async function setLessonCompletion(
  lessonId: string,
  completed: boolean
): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const orgId = await fetchOrgId();
  if (!orgId) return false;

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      org_id: orgId,
      user_id: user.id,
      lesson_id: lessonId,
      completed_at: completed ? new Date().toISOString() : null,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) throw error;
  return completed;
}

/**
 * The caller's org id, read from their own profile row.
 *
 * Every table carries `org_id` so multi-tenant stays a weekend rather than a
 * rewrite; inserts have to supply it. Taking it from the profile rather than
 * hardcoding the single row today is what makes that true.
 */
let cachedOrgId: string | null = null;
async function fetchOrgId(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  cachedOrgId = data?.org_id ?? null;
  return cachedOrgId;
}
