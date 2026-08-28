/**
 * Single-lesson reads for the player.
 *
 * Navigation (prev/next, module context) comes from the public `curriculum`
 * view so the rail renders in full even for lessons the student cannot open —
 * a locked lesson must still be visible, or the outline has holes in it.
 *
 * Whether the lesson is actually *readable* is a separate question, answered
 * by the `lessons` table, where RLS applies. That query names its columns
 * because `select('*')` errors for client roles: bunny_video_id is revoked at
 * the column level, and a star select is rejected wholesale.
 */
import { createClient } from '@/lib/supabase/client';
import type { Lesson, Module } from '@/types/index';
import type { Db } from './client';
import { fetchCurriculum } from './curriculum';
import { fetchEntitledSkus } from './profile';

export interface LessonContext {
  lesson: Lesson;
  module: Module;
  nextLessonId: string | null;
  prevLessonId: string | null;
  isCompleted: boolean;
  isLocked: boolean;
}

export async function fetchLessonContext(
  lessonId: string,
  db?: Db
): Promise<LessonContext | null> {
  const supabase = db ?? createClient();

  const [{ modules, moduleSkus }, entitledSkus] = await Promise.all([
    fetchCurriculum(supabase),
    fetchEntitledSkus(supabase),
  ]);

  const owningModule = modules.find((m) =>
    m.lessons.some((l) => l.id === lessonId)
  );
  const lesson = owningModule?.lessons.find((l) => l.id === lessonId);

  // Unknown id: a stale link or a lesson that is not published. Let the caller
  // render a not-found state rather than silently substituting another lesson.
  if (!owningModule || !lesson) return null;

  const flat = modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);

  const sku = moduleSkus.get(owningModule.id) ?? 'recordings';
  const isLocked = !entitledSkus.includes(sku) && lesson.isFree !== true;

  const { data: progress, error } = await supabase
    .from('lesson_progress')
    .select('completed_at')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) throw error;

  return {
    lesson,
    module: owningModule,
    prevLessonId: index > 0 ? flat[index - 1].id : null,
    nextLessonId: index >= 0 && index < flat.length - 1 ? flat[index + 1].id : null,
    isCompleted: Boolean(progress?.completed_at),
    isLocked,
  };
}
