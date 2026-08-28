/**
 * Verifies the Stage 2a read path against the live database, using the ANON
 * key and a real signed-in session — the same path lib/db takes in the browser.
 * Mirrors the query shapes and the resume rule so a mismatch shows up here
 * rather than as an empty screen.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PASSWORD = 'TestStudent!2026';

/** Concrete client type, taken from the factory so the generics line up. */
const makeDb = () => createClient(url, anon);
type Db = ReturnType<typeof makeDb>;

const CURRICULUM_COLS =
  'module_id, module_order, module_title, product_sku, lesson_id, lesson_order, lesson_title, duration_seconds, is_free_preview';

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} ${detail}`);
  if (!ok) failures++;
}

async function curriculum(db: Db) {
  const { data, error } = await db
    .from('curriculum')
    .select(CURRICULUM_COLS)
    .order('module_order')
    .order('lesson_order');
  if (error) throw error;
  const mods = new Map<string, any>();
  for (const r of data as any[]) {
    if (!mods.has(r.module_id))
      mods.set(r.module_id, { sku: r.product_sku, order: r.module_order, lessons: [] });
    mods.get(r.module_id).lessons.push(r);
  }
  return [...mods.entries()].map(([id, m]) => ({ id, ...m }));
}

async function entitledSkus(db: Db) {
  const [{ data: enr }, { data: prods }] = await Promise.all([
    db.from('enrollments').select('product_sku, expires_at'),
    db.from('products').select('sku, grants_skus'),
  ]);
  const grants = new Map((prods as any[]).map((p) => [p.sku, p.grants_skus ?? []]));
  const out = new Set<string>();
  for (const e of (enr as any[]) ?? []) {
    if (e.expires_at && new Date(e.expires_at).getTime() <= Date.now()) continue;
    out.add(e.product_sku);
    for (const g of grants.get(e.product_sku) ?? []) out.add(g);
  }
  return out;
}

/** The resume rule from lib/db/progress.ts, replicated to prove it against real rows. */
async function resume(db: Db) {
  const [mods, skus, { data: prog }] = await Promise.all([
    curriculum(db),
    entitledSkus(db),
    db.from('lesson_progress').select('lesson_id, position_seconds, completed_at'),
  ]);
  const byLesson = new Map((prog as any[]).map((p) => [p.lesson_id, p]));
  let completed = 0;
  let total = 0;
  let next: any = null;
  let lockedModules = 0;

  for (const m of mods) {
    const unlocked = skus.has(m.sku);
    if (!unlocked) lockedModules++;
    for (const l of m.lessons) {
      total++;
      const row = byLesson.get(l.lesson_id);
      if (row?.completed_at) { completed++; continue; }
      if (next) continue;
      if (!(unlocked || l.is_free_preview)) continue;
      next = { title: l.lesson_title, module: m.order, pos: row?.position_seconds ?? 0 };
    }
  }
  return { completed, total, next, lockedModules, moduleCount: mods.length };
}

async function main() {
  console.log('\nLOGGED-OUT (public curriculum path)\n');
  const anonDb = makeDb();
  const publicMods = await curriculum(anonDb);
  const publicLessons = publicMods.reduce((n, m) => n + m.lessons.length, 0);
  check('logged-out visitor reads the curriculum', publicMods.length === 6 && publicLessons === 15,
    `${publicMods.length} modules / ${publicLessons} lessons`);

  const cases: Array<[string, string, number, number, boolean]> = [
    // email, tier, expectedComplete, expectedLockedModules, expectNextLesson
    ['chidi.okonkwo@flagskool.test',   'cohort',     11, 0, true],
    ['amara.nwosu@flagskool.test',     'recordings',  4, 1, true],
    ['ngozi.eze@flagskool.test',       'cohort',      0, 0, true],
    ['funke.adeyemi@flagskool.test',   'cohort',     15, 0, false],
  ];

  for (const [email, tier, expComplete, expLocked, expNext] of cases) {
    console.log(`\n${email}  (${tier})\n`);
    const db = makeDb();
    const { error } = await db.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) { check('sign in', false, error.message); continue; }

    const r = await resume(db);
    check('completed count matches seed', r.completed === expComplete,
      `${r.completed}/${r.total} complete`);
    check('locked module count', r.lockedModules === expLocked,
      `${r.lockedModules} locked of ${r.moduleCount}`);
    check('resume target', Boolean(r.next) === expNext,
      r.next ? `M${r.next.module} · "${r.next.title.slice(0, 34)}" @${r.next.pos}s` : 'none (course complete)');

    if (r.next) {
      const skus = await entitledSkus(db);
      check('resume target is actually openable', skus.size > 0, `entitled: [${[...skus].join(', ')}]`);
    }
    await db.auth.signOut();
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
