/**
 * Profile, enrollment, and entitlement reads.
 *
 * `profiles` RLS lets a user read only their own row (admins read all), so
 * everything here is implicitly scoped to the signed-in user. Passing a userId
 * does not widen that — RLS decides, not the argument.
 */
import { createClient } from '@/lib/supabase/client';
import { config } from '@/config/flagskool.config';
import type { Enrollment, UserProfile } from '@/types/index';
import type { Db } from './client';
import {
  formatFullDate,
  formatJoinedDate,
  toEnrollmentStatus,
  toProfileRole,
  toTier,
} from './mappers';

/**
 * The signed-in user's profile, or null when logged out.
 *
 * `tier` has no column behind it — it is derived from active enrollments, so
 * this needs both queries.
 */
export async function fetchUserProfile(db?: Db): Promise<UserProfile | null> {
  const supabase = db ?? createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, skus] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_alumni, created_at')
      .eq('id', user.id)
      .maybeSingle(),
    fetchEntitledSkus(supabase),
  ]);

  if (profileResult.error) throw profileResult.error;
  const row = profileResult.data;
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.full_name ?? '',
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    role: toProfileRole(row.role, row.is_alumni),
    tier: toTier(skus),
    joinedDate: formatJoinedDate(row.created_at),
  };
}

/**
 * Every product sku the user can currently reach, expanded through
 * `products.grants_skus` — a cohort enrollment also grants recordings.
 *
 * This mirrors the `user_has_sku` definer function used by RLS. The database
 * remains the enforcement point; this is only so the UI can render a lock
 * before the query comes back empty.
 */
export async function fetchEntitledSkus(db?: Db): Promise<string[]> {
  const supabase = db ?? createClient();

  const [enrollmentsResult, productsResult] = await Promise.all([
    supabase.from('enrollments').select('product_sku, expires_at'),
    supabase.from('products').select('sku, grants_skus'),
  ]);

  if (enrollmentsResult.error) throw enrollmentsResult.error;
  if (productsResult.error) throw productsResult.error;

  const grants = new Map(
    (productsResult.data ?? []).map((p) => [p.sku, p.grants_skus ?? []])
  );

  const entitled = new Set<string>();
  for (const row of enrollmentsResult.data ?? []) {
    if (toEnrollmentStatus(row.expires_at) === 'expired') continue;
    entitled.add(row.product_sku);
    for (const granted of grants.get(row.product_sku) ?? []) {
      entitled.add(granted);
    }
  }

  return [...entitled];
}

/**
 * The user's enrollments, for the account page.
 *
 * Amount and reference live on `transactions`, not `enrollments`, so this
 * joins through `transaction_id`. An invite or comp enrollment has no
 * transaction at all — hence the zero amount and the dash.
 */
export async function fetchEnrollments(db?: Db): Promise<Enrollment[]> {
  const supabase = db ?? createClient();

  const { data, error } = await supabase
    .from('enrollments')
    .select(
      // Must stay a single string literal: supabase-js infers row types from
      // it, and concatenation collapses it to `string`, losing them all.
      'id, product_sku, created_at, expires_at, source, transactions(reference, amount_kobo)'
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    // The embed is an object for a to-one relationship, but PostgREST types it
    // as a union — normalise before reading.
    const txRaw = (row as { transactions?: unknown }).transactions;
    const tx = (Array.isArray(txRaw) ? txRaw[0] : txRaw) as
      | { reference: string; amount_kobo: number }
      | null
      | undefined;

    const tierId = row.product_sku === 'cohort' ? 'cohort' : 'recordings';

    return {
      id: row.id,
      tierId,
      tierName: config.pricing[tierId].name,
      purchaseDate: formatFullDate(row.created_at),
      amountPaidKobo: tx?.amount_kobo ?? 0,
      status: toEnrollmentStatus(row.expires_at),
      reference: tx?.reference ?? '—',
    } satisfies Enrollment;
  });
}
