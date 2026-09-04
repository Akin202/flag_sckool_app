/**
 * Map Bunny Stream video GUIDs onto `lessons.bunny_video_id`.
 *
 * The 13 course videos are uploaded to Bunny by hand, and each one comes back
 * with a GUID that has to reach the right lesson row. Doing that by eye across
 * 13 rows is exactly the kind of task that produces one silently wrong mapping
 * — a student opens Module 3 Lesson 2 and watches Module 4 Lesson 1, which
 * nobody reports as a bug because it looks like a curriculum decision.
 *
 * So: match on normalised title, print the full plan, and refuse to write
 * anything without --apply. Unmatched rows on BOTH sides are printed loudly,
 * because a lesson with no video and a video with no lesson are different
 * problems and both are silent otherwise.
 *
 * Uses the service role: `bunny_video_id` is revoked from every client role,
 * so no other key can write it.
 *
 *   npm run bunny:sync              # dry run, prints the plan
 *   npm run bunny:sync -- --apply   # writes
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = process.env.BUNNY_STREAM_API_KEY;

const missing = [
  ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
  ['BUNNY_STREAM_LIBRARY_ID', libraryId],
  ['BUNNY_STREAM_API_KEY', apiKey],
].filter(([, v]) => !v).map(([k]) => k);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(', ')}`);
  console.error('Fill these in .env.local — see .env.example.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

interface BunnyVideo {
  guid: string;
  title: string;
  status: number;
  length: number;
}

/**
 * Titles are typed twice — once in the curriculum seed, once into the Bunny
 * dashboard — so compare them leniently. Case, punctuation, and any
 * "Module 3 — " / "Lesson 2: " prefix a filename picked up are all noise.
 */
function normalise(title: string): string {
  return title
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/^(module|lesson|part|pt)\s*\d+\s*[-–—:.]?\s*/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Bunny encoding status 4 = Finished. Anything less will not play. */
const STATUS_FINISHED = 4;
const STATUS_LABEL: Record<number, string> = {
  0: 'Queued', 1: 'Processing', 2: 'Encoding', 3: 'Finished(partial)',
  4: 'Finished', 5: 'Failed', 6: 'PresignedUploadStarted',
};

async function fetchBunnyVideos(): Promise<BunnyVideo[]> {
  const all: BunnyVideo[] = [];
  // The library holds 13 videos today, but paginate properly rather than
  // assuming one page — a silently truncated list would look like "Bunny is
  // missing videos" instead of "the script stopped at 100".
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=100`,
      { headers: { AccessKey: apiKey!, accept: 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(
        `Bunny API ${response.status}: ${await response.text()}\n` +
        'Check BUNNY_STREAM_API_KEY (Stream -> library -> API) and BUNNY_STREAM_LIBRARY_ID.'
      );
    }

    const body = await response.json();
    const items: BunnyVideo[] = body.items ?? [];
    all.push(...items);
    if (items.length < 100) return all;
  }
}

const db = createClient(supabaseUrl!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const videos = await fetchBunnyVideos();
console.log(`Bunny library ${libraryId}: ${videos.length} video(s).\n`);

const { data: lessons, error } = await db
  .from('lessons')
  .select('id, title, bunny_video_id, order_index, module_id')
  .order('module_id')
  .order('order_index');

if (error) throw error;

const byTitle = new Map<string, BunnyVideo[]>();
for (const video of videos) {
  const key = normalise(video.title);
  byTitle.set(key, [...(byTitle.get(key) ?? []), video]);
}

const planned: { id: string; title: string; guid: string }[] = [];
const unmatched: string[] = [];
const ambiguous: string[] = [];
const unchanged: string[] = [];
const notEncoded: string[] = [];
const claimed = new Set<string>();

for (const lesson of lessons ?? []) {
  const candidates = byTitle.get(normalise(lesson.title)) ?? [];

  if (candidates.length === 0) {
    unmatched.push(lesson.title);
    continue;
  }
  if (candidates.length > 1) {
    ambiguous.push(`${lesson.title}  ->  ${candidates.map((c) => c.guid).join(', ')}`);
    continue;
  }

  const video = candidates[0];
  claimed.add(video.guid);

  if (video.status !== STATUS_FINISHED) {
    notEncoded.push(
      `${lesson.title}  (${STATUS_LABEL[video.status] ?? `status ${video.status}`})`
    );
    continue;
  }
  if (lesson.bunny_video_id === video.guid) {
    unchanged.push(lesson.title);
    continue;
  }

  planned.push({ id: lesson.id, title: lesson.title, guid: video.guid });
}

const orphans = videos.filter((v) => !claimed.has(v.guid));

function section(label: string, rows: string[]) {
  if (rows.length === 0) return;
  console.log(`${label} (${rows.length})`);
  for (const row of rows) console.log(`  ${row}`);
  console.log();
}

section('ALREADY CORRECT', unchanged);
section('WILL UPDATE', planned.map((p) => `${p.title}  ->  ${p.guid}`));
section('STILL ENCODING — rerun when finished', notEncoded);
section('LESSON HAS NO MATCHING BUNNY VIDEO', unmatched);
section('AMBIGUOUS — two Bunny videos share a title, rename one', ambiguous);
section('BUNNY VIDEO MATCHES NO LESSON', orphans.map((v) => `${v.title}  (${v.guid})`));

if (planned.length === 0) {
  console.log('Nothing to write.');
  process.exit(unmatched.length > 0 || ambiguous.length > 0 ? 1 : 0);
}

if (!APPLY) {
  console.log(`Dry run. Re-run with --apply to write ${planned.length} row(s).`);
  process.exit(0);
}

for (const row of planned) {
  const { error: updateError } = await db
    .from('lessons')
    .update({ bunny_video_id: row.guid })
    .eq('id', row.id);

  if (updateError) {
    console.error(`FAILED  ${row.title}: ${updateError.message}`);
    process.exit(1);
  }
  console.log(`WROTE   ${row.title}  ->  ${row.guid}`);
}

console.log(`\n${planned.length} row(s) updated.`);
