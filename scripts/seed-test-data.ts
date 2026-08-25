/**
 * Test data for exercising the admin screens. NOT a migration, deliberately.
 *
 * The Supabase project this points at becomes production. Nothing in here may
 * ever run as part of `supabase db push`, which is why it lives in scripts/
 * behind an explicit opt-in:
 *
 *   ALLOW_TEST_SEED=1 npm run seed:test
 *
 * Every account it creates uses the @flagskool.test domain, so
 * supabase/migrations/20260825009999_pre_launch_cleanup.sql can remove all of
 * it by pattern before launch.
 */
import { createClient } from '@supabase/supabase-js';

if (process.env.ALLOW_TEST_SEED !== '1') {
  console.error(
    'Refusing to run without ALLOW_TEST_SEED=1.\n' +
      'This writes fake students and transactions into a project that becomes production.',
  );
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error('Missing Supabase env. Run with: node --env-file=.env.local ...');
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Kept in the .test TLD so the cleanup migration can match on it. */
const TEST_DOMAIN = 'flagskool.test';
const PASSWORD = 'TestStudent!2026';

const STUDENTS = [
  { name: 'Chidi Okonkwo',    sku: 'cohort',     alumni: false, completed: 11 },
  { name: 'Amara Nwosu',      sku: 'recordings', alumni: false, completed: 4 },
  { name: 'Tunde Bakare',     sku: 'recordings', alumni: true,  completed: 14 },
  { name: 'Ngozi Eze',        sku: 'cohort',     alumni: false, completed: 0 },
  { name: 'Yusuf Abdullahi',  sku: 'recordings', alumni: false, completed: 2 },
  { name: 'Funke Adeyemi',    sku: 'cohort',     alumni: true,  completed: 15 },
] as const;

const PRICE_KOBO: Record<string, number> = { recordings: 10000000, cohort: 15000000 };

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '.');

async function main() {
  const { data: org, error: orgErr } = await admin
    .from('organizations').select('id').eq('slug', 'flag-skool').single();
  if (orgErr || !org) throw new Error('No organization. Apply the curriculum seed migration first.');

  const { data: lessons, error: lessonErr } = await admin
    .from('lessons').select('id').order('order_index');
  if (lessonErr || !lessons?.length) throw new Error('No lessons seeded.');

  console.log(`org ${org.id} — ${lessons.length} lessons\n`);

  // --- discount codes -------------------------------------------------------
  const codes = [
    { code: 'ALUMNI50',  kind: 'alumni', value: { percent: 50 }, applies_to_sku: 'all',     max_redemptions: null },
    { code: 'EARLY25',   kind: 'promo',  value: { percent: 25 }, applies_to_sku: 'cohort',  max_redemptions: 100 },
    { code: 'INVITE100', kind: 'invite', value: { percent: 100 }, applies_to_sku: 'all',    max_redemptions: 5 },
    { code: 'SAVE20K',   kind: 'promo',  value: { kobo: 2000000 }, applies_to_sku: 'recordings', max_redemptions: 50 },
  ];
  const { error: codeErr } = await admin
    .from('discount_codes')
    .upsert(codes.map((c) => ({ ...c, org_id: org.id })), { onConflict: 'org_id,code' });
  if (codeErr) throw new Error(`discount codes: ${codeErr.message}`);
  console.log(`discount codes: ${codes.length}`);

  // --- students -------------------------------------------------------------
  for (const s of STUDENTS) {
    const email = `${slug(s.name)}@${TEST_DOMAIN}`;

    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: s.name },
    });
    if (userErr) {
      console.log(`  skip ${email} (${userErr.message})`);
      continue;
    }
    const userId = created.user!.id;

    if (s.alumni) {
      await admin.from('profiles').update({ is_alumni: true }).eq('id', userId);
    }

    const reference = `FLG-TEST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const { data: txn, error: txnErr } = await admin
      .from('transactions')
      .insert({
        org_id: org.id,
        user_id: userId,
        product_sku: s.sku,
        reference,
        amount_kobo: PRICE_KOBO[s.sku],
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (txnErr) throw new Error(`transaction for ${email}: ${txnErr.message}`);

    const { error: enrollErr } = await admin.from('enrollments').insert({
      org_id: org.id,
      user_id: userId,
      product_sku: s.sku,
      source: 'purchase',
      transaction_id: txn.id,
    });
    if (enrollErr) throw new Error(`enrollment for ${email}: ${enrollErr.message}`);

    // Progress: N completed lessons, plus a partial position on the next one,
    // so the resume UI has something real to render.
    const progress = lessons.slice(0, s.completed).map((l) => ({
      org_id: org.id,
      user_id: userId,
      lesson_id: l.id,
      position_seconds: 0,
      completed_at: new Date().toISOString(),
    }));
    const nextLesson = lessons[s.completed];
    if (nextLesson) {
      progress.push({
        org_id: org.id,
        user_id: userId,
        lesson_id: nextLesson.id,
        position_seconds: 2712, // 45:12 — matches the mock resume state
        completed_at: null as unknown as string,
      });
    }
    if (progress.length) {
      const { error: progErr } = await admin.from('lesson_progress').insert(progress);
      if (progErr) throw new Error(`progress for ${email}: ${progErr.message}`);
    }

    console.log(`  ${email.padEnd(38)} ${s.sku.padEnd(11)} ${s.completed}/${lessons.length} complete`);
  }

  console.log(`\nDone. Every account is @${TEST_DOMAIN} — password: ${PASSWORD}`);
  console.log('Remove it all before launch with the pre_launch_cleanup migration.');
}

main().catch((err) => {
  console.error(`\nFAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
