/**
 * The paywall acceptance test.
 *
 * Creates a real, email-confirmed student with NO enrollment, signs in as
 * them with the public anon key, and tries to read paid content the way an
 * attacker would: straight against PostgREST, bypassing every line of
 * application code.
 *
 * Run:  npm run rls:attack
 *
 * Exits non-zero if ANY attack succeeds or ANY positive control fails.
 * The positive controls matter as much as the attacks — a policy that denies
 * everything to everyone passes a deny-only test while breaking the product.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error('Missing Supabase env. Run with: node --env-file=.env.local ...');
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Date.now();
const PROBE_EMAIL = `rls-attack-probe+${stamp}@flagskool.test`;
const CONTROL_EMAIL = `rls-control-enrolled+${stamp}@flagskool.test`;
const PASSWORD = `Probe!${stamp}aA1`;

/**
 * bunny_video_id is revoked at the column level, so `select *` on lessons
 * errors for every client role. Naming the readable columns keeps the lesson
 * attacks honest: they then prove the ROW policy denies access, rather than
 * passing incidentally because the column grant rejected the star.
 * The column grant gets its own dedicated attack further down.
 */
const LESSON_COLS = 'id, title, description, duration_seconds, is_free_preview, published_at';

type Result = { name: string; passed: boolean; detail: string };
const results: Result[] = [];

function record(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
  console.log(`${passed ? '  PASS' : '  FAIL'}  ${name}\n        ${detail}`);
}

/** An attack passes when it returns no rows — whether by policy or by error. */
function attack(name: string, data: unknown[] | null, error: { message: string } | null) {
  const rows = data?.length ?? 0;
  if (error) return record(name, true, `blocked with error: ${error.message}`);
  return record(name, rows === 0, rows === 0 ? 'returned 0 rows' : `LEAKED ${rows} row(s)`);
}

/** A control passes when it DOES return rows. */
function control(name: string, data: unknown[] | null, error: { message: string } | null) {
  const rows = data?.length ?? 0;
  if (error) return record(name, false, `unexpected error: ${error.message}`);
  return record(name, rows > 0, rows > 0 ? `returned ${rows} row(s)` : 'returned 0 rows — access is over-restricted');
}

async function createUser(email: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user!.id;
}

async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return client;
}

let probeId: string | null = null;
let controlId: string | null = null;

async function main() {
  console.log(`\nFlag Skool — RLS attack suite\nproject: ${URL}\n`);

  // --- fixtures -------------------------------------------------------------
  probeId = await createUser(PROBE_EMAIL);
  controlId = await createUser(CONTROL_EMAIL);

  const { data: org } = await admin.from('organizations').select('id').eq('slug', 'flag-skool').single();
  if (!org) throw new Error('No organization seeded. Apply the curriculum seed migration first.');

  // The control student buys the recordings. The probe buys nothing.
  const { error: enrollErr } = await admin.from('enrollments').insert({
    org_id: org.id,
    user_id: controlId,
    product_sku: 'recordings',
    source: 'comp',
  });
  if (enrollErr) throw new Error(`seeding control enrollment: ${enrollErr.message}`);

  const { data: paidLesson } = await admin
    .from('lessons').select('id, title').eq('is_free_preview', false).limit(1).single();
  const { data: freeLesson } = await admin
    .from('lessons').select('id, title').eq('is_free_preview', true).limit(1).single();
  if (!paidLesson || !freeLesson) throw new Error('Curriculum seed missing paid or free lessons.');

  console.log(`probe   (no enrollment): ${PROBE_EMAIL}`);
  console.log(`control (recordings):    ${CONTROL_EMAIL}`);
  console.log(`paid lesson under test:  "${paidLesson.title}"\n`);

  const probe = await signIn(PROBE_EMAIL);

  // --- attacks --------------------------------------------------------------
  console.log('ATTACKS  (must all return zero rows)\n');

  {
    const { data, error } = await probe.from('lessons').select(LESSON_COLS).eq('is_free_preview', false);
    attack('unenrolled student reads paid lessons', data, error);
  }
  {
    const { data, error } = await probe.from('lessons').select(LESSON_COLS).eq('id', paidLesson.id);
    attack('unenrolled student reads one paid lesson by id', data, error);
  }
  {
    const { data, error } = await probe.from('resources').select('*');
    attack('unenrolled student reads paid resources', data, error);
  }
  {
    const { data, error } = await probe.from('discount_codes').select('*');
    attack('any student reads discount_codes', data, error);
  }
  {
    const { data, error } = await probe.from('enrollments').select('*');
    attack("unenrolled student reads others' enrollments", data, error);
  }
  {
    const { data, error } = await probe.from('transactions').select('*');
    attack("unenrolled student reads others' transactions", data, error);
  }
  {
    // The money attack: grant yourself the course.
    const { data, error } = await probe
      .from('enrollments')
      .insert({ org_id: org.id, user_id: probeId, product_sku: 'cohort', source: 'purchase' })
      .select();
    attack('student self-inserts an enrollment (the 150,000 naira attack)', data, error);
  }
  {
    // Privilege escalation. The profiles UPDATE policy lets a student write
    // their own row, so what stops this is the column grant, not the policy.
    // Checking the response is not enough — read the row back as admin and
    // confirm the role did not actually change.
    await probe.from('profiles').update({ role: 'admin' }).eq('id', probeId);
    const { data: after } = await admin.from('profiles').select('role').eq('id', probeId).single();
    record(
      'student promotes self to admin',
      after?.role === 'student',
      after?.role === 'student' ? "role still 'student' after the write" : `ESCALATED to '${after?.role}'`,
    );
  }
  {
    // Even an ENTITLED user must not lift the raw video id — playback is
    // signed server-side. This is the column grant, not the row policy, which
    // is why it is tested with the enrolled account rather than the probe.
    const enrolled = await signIn(CONTROL_EMAIL);
    const { data, error } = await enrolled.from('lessons').select('bunny_video_id');
    attack('ENROLLED student reads bunny_video_id directly', data, error);
  }

  // --- positive controls ----------------------------------------------------
  console.log('\nCONTROLS  (must all return rows — proves we are not just denying everything)\n');

  {
    const { data, error } = await probe.from('lessons').select(LESSON_COLS).eq('id', freeLesson.id);
    control('unenrolled student reads the FREE preview lesson', data, error);
  }
  {
    const anon = createClient(URL!, ANON!);
    const { data, error } = await anon.from('curriculum').select('*');
    control('logged-out visitor reads the public curriculum view', data, error);
  }
  {
    const anon = createClient(URL!, ANON!);
    const { data, error } = await anon.from('products').select('*');
    control('logged-out visitor reads product pricing', data, error);
  }
  {
    const enrolled = await signIn(CONTROL_EMAIL);
    const { data, error } = await enrolled.from('lessons').select(LESSON_COLS).eq('id', paidLesson.id);
    control('ENROLLED student reads the same paid lesson', data, error);
  }
  {
    const { data, error } = await probe.from('profiles').select('*').eq('id', probeId);
    control('student reads their own profile', data, error);
  }
}

async function cleanup() {
  for (const id of [probeId, controlId]) {
    if (!id) continue;
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`  cleanup: failed to delete ${id}: ${error.message}`);
  }
  console.log('\ncleanup: probe accounts deleted');
}

main()
  .catch((err) => {
    console.error(`\nSUITE ERROR: ${err instanceof Error ? err.message : String(err)}`);
    results.push({ name: 'suite completed', passed: false, detail: String(err) });
  })
  .finally(async () => {
    await cleanup();
    const failed = results.filter((r) => !r.passed);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${results.length - failed.length}/${results.length} passed`);
    if (failed.length > 0) {
      console.log(`\nFAILURES:`);
      failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
      console.log('\nPAYWALL IS NOT SEALED.');
      process.exit(1);
    }
    console.log('\nPaywall verified: no unentitled read succeeded.');
    process.exit(0);
  });
