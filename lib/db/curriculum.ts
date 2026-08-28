/**
 * Curriculum reads.
 *
 * Everything here goes through the `curriculum` view, not the `lessons` table.
 * The view is deliberately not security_invoker: it exposes exactly the safe
 * columns of published lessons to anon and authenticated alike, because module
 * and lesson *titles* are marketing — the video is what is paid for. Reading
 * the `lessons` table directly would be gated by entitlement and would leave a
 * logged-out visitor with an empty landing page.
 *
 * bunny_video_id is absent from the view by construction, so it can never leak
 * through this path.
 */
import { createClient } from '@/lib/supabase/client';
import type { Lesson, Module } from '@/types/index';
import type { Db } from './client';
import { toDurationMinutes } from './mappers';

/** One row of the curriculum view, after nullable columns are discarded. */
interface CurriculumRow {
  module_id: string;
  module_order: number;
  module_title: string;
  module_description: string | null;
  product_sku: string;
  lesson_id: string;
  lesson_order: number;
  lesson_title: string;
  lesson_description: string | null;
  duration_seconds: number | null;
  is_free_preview: boolean | null;
}

/** Module id → the product sku that unlocks it. Needed for lock state. */
export type ModuleSkuMap = ReadonlyMap<string, string>;

export interface CurriculumResult {
  modules: Module[];
  moduleSkus: ModuleSkuMap;
}

/**
 * The whole published curriculum, grouped into modules.
 *
 * The view is flat (one row per lesson) and carries no lesson count or module
 * duration, so both are computed here rather than in SQL — it is a fold over
 * at most a few hundred rows and avoids a migration.
 */
export async function fetchCurriculum(db?: Db): Promise<CurriculumResult> {
  const supabase = db ?? createClient();

  const { data, error } = await supabase
    .from('curriculum')
    .select(
      // One string literal, deliberately: supabase-js derives the row type
      // from it, and concatenating collapses it to `string`.
      'module_id, module_order, module_title, module_description, product_sku, lesson_id, lesson_order, lesson_title, lesson_description, duration_seconds, is_free_preview'
    )
    .order('module_order', { ascending: true })
    .order('lesson_order', { ascending: true });

  if (error) throw error;

  const byModule = new Map<string, Module>();
  const moduleSkus = new Map<string, string>();

  for (const raw of data ?? []) {
    const row = raw as Partial<CurriculumRow>;

    // The view's columns are all nullable in the generated types because it is
    // a view over a join. A row missing either id is not renderable.
    if (!row.module_id || !row.lesson_id) continue;

    let mod = byModule.get(row.module_id);
    if (!mod) {
      mod = {
        id: row.module_id,
        number: row.module_order ?? 0,
        title: row.module_title ?? '',
        description: row.module_description ?? undefined,
        lessonCount: 0,
        totalDurationMinutes: 0,
        lessons: [],
      };
      byModule.set(row.module_id, mod);
      moduleSkus.set(row.module_id, row.product_sku ?? 'recordings');
    }

    const lesson: Lesson = {
      id: row.lesson_id,
      title: row.lesson_title ?? '',
      description: row.lesson_description ?? undefined,
      durationMinutes: toDurationMinutes(row.duration_seconds ?? 0),
      isFree: row.is_free_preview ?? false,
      // Unreadable by any client role — revoked at the column level so a signed
      // URL is the only way to reach a video. Playback is issued server-side.
      bunnyVideoId: '',
    };

    mod.lessons.push(lesson);
    mod.lessonCount += 1;
    mod.totalDurationMinutes += lesson.durationMinutes;
  }

  return { modules: [...byModule.values()], moduleSkus };
}
