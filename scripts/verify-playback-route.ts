/**
 * Acceptance test for the lesson playback route, unauthenticated.
 *
 * The contract for a logged-out caller is that NOTHING distinguishes one
 * lesson from another: paid, free-preview, and nonexistent all return the same
 * 401 with the same body. No signed URL, and no oracle for what exists.
 *
 * Worth stating why the free preview is not special here. The RLS policy reads
 * `to anon, authenticated`, which looks like anon can open Lesson 1 — but the
 * policy calls `user_has_sku()`, which is deliberately revoked from anon, so
 * the query raises 42501 rather than returning a row. The route gates on
 * `getUser()` ahead of that; without the gate every anonymous request is a 500.
 * See the route's own comment for the full reasoning.
 *
 * The entitled path needs a real session and is covered by smoke-browser.mjs,
 * which logs in and calls the route from page context.
 *
 * Needs the dev server running. Point at it with BASE_URL (default :3001).
 */
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(50)} ${detail}`);
  if (!ok) failures++;
}

const db = createClient(url, anon);

const { data: rows, error } = await db
  .from('curriculum')
  .select('lesson_id, lesson_title, is_free_preview')
  .order('module_order')
  .order('lesson_order');

if (error) throw error;

const free = rows!.find((r) => r.is_free_preview);
const paid = rows!.find((r) => !r.is_free_preview);

if (!free || !paid) {
  console.error('Need both a free-preview and a paid lesson in the curriculum.');
  process.exit(1);
}

async function hit(lessonId: string) {
  const response = await fetch(`${BASE_URL}/api/lessons/${lessonId}/playback`);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

console.log(`\nplayback route @ ${BASE_URL} (logged out)\n`);

const paidResult = await hit(paid.lesson_id!);
const freeResult = await hit(free.lesson_id!);
const bogusResult = await hit('00000000-0000-0000-0000-000000000000');

for (const [label, result] of [
  ['paid lesson', paidResult],
  ['free preview', freeResult],
  ['unknown id', bogusResult],
] as const) {
  check(
    `${label} is refused`,
    result.status === 401,
    `${result.status} ${JSON.stringify(result.body)}`
  );
  check(
    `${label} leaks no signed URL`,
    typeof result.body?.url !== 'string',
    result.body?.url ? 'URL PRESENT' : 'none'
  );
}

// The three must be indistinguishable, or the route is an existence oracle.
const shapes = new Set(
  [paidResult, freeResult, bogusResult].map((r) => `${r.status}:${JSON.stringify(r.body)}`)
);
check(
  'paid, free and unknown are indistinguishable',
  shapes.size === 1,
  `${shapes.size} distinct response(s)`
);

// A 500 here would mean the getUser() gate was removed and anon reached the
// policy, which raises 42501 on user_has_sku.
check(
  'no 500 — anon never reaches the lessons policy',
  ![paidResult, freeResult, bogusResult].some((r) => r.status >= 500),
  'no server errors'
);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
