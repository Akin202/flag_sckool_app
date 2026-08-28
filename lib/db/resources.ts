/**
 * Resource reads.
 *
 * `resources` RLS inherits the parent module's entitlement, so an unenrolled
 * student simply gets fewer rows — there is no separate access check to write
 * here, and adding one would only duplicate the policy.
 *
 * `downloadUrl` is deliberately a route-handler path, not a storage URL. The
 * signed URL is minted server-side, with a short TTL, after the entitlement is
 * re-checked — a URL handed to the browser at list time would outlive the page
 * and be shareable.
 */
import { createClient } from '@/lib/supabase/client';
import type { LessonResource, VaultResource } from '@/types/index';
import type { Db } from './client';
import { fetchCurriculum } from './curriculum';
import { formatBytes, toResourceKind } from './mappers';

const RESOURCE_COLUMNS =
  'id, title, description, kind, file_format, size_bytes, storage_path, external_url, lesson_id, module_id';

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  file_format: string;
  size_bytes: number;
  storage_path: string | null;
  external_url: string | null;
  lesson_id: string | null;
  module_id: string;
}

function toLessonResource(row: ResourceRow): LessonResource {
  return {
    id: row.id,
    title: row.title,
    kind: toResourceKind(row.kind),
    fileFormat: (row.file_format ?? '').toUpperCase(),
    sizeBytes: row.size_bytes ?? 0,
    sizeFormatted: formatBytes(row.size_bytes ?? 0),
    // An external link needs no signing; everything else is minted on demand.
    downloadUrl: row.external_url ?? `/api/resources/${row.id}/download`,
    lessonId: row.lesson_id ?? undefined,
    moduleId: row.module_id,
  };
}

export async function fetchLessonResources(
  lessonId: string,
  db?: Db
): Promise<LessonResource[]> {
  const supabase = db ?? createClient();

  const { data, error } = await supabase
    .from('resources')
    .select(RESOURCE_COLUMNS)
    .eq('lesson_id', lessonId)
    .order('title', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toLessonResource(row as ResourceRow));
}

/**
 * Everything the student can reach, decorated with module and lesson titles
 * for the Vault's filter chips. Titles come from the curriculum view rather
 * than a join, so one fetch covers every row.
 */
export async function fetchVaultResources(db?: Db): Promise<VaultResource[]> {
  const supabase = db ?? createClient();

  const [{ modules }, result] = await Promise.all([
    fetchCurriculum(supabase),
    supabase.from('resources').select(RESOURCE_COLUMNS).order('title'),
  ]);

  if (result.error) throw result.error;

  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const lessonTitleById = new Map(
    modules.flatMap((m) => m.lessons.map((l) => [l.id, l.title] as const))
  );

  return (result.data ?? []).map((raw) => {
    const row = raw as ResourceRow;
    const mod = moduleById.get(row.module_id);

    return {
      ...toLessonResource(row),
      description: row.description ?? undefined,
      moduleNumber: mod?.number ?? 0,
      moduleTitle: mod?.title ?? '',
      lessonTitle: row.lesson_id
        ? lessonTitleById.get(row.lesson_id)
        : undefined,
    } satisfies VaultResource;
  });
}
