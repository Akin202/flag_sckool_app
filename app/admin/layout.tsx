import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

/**
 * The admin role gate.
 *
 * `proxy.ts` only redirects logged-out visitors — it checks that you are
 * *someone*, never that you are the founder. Without this, any signed-in
 * student could open /admin. That leaked nothing while the admin screens were
 * mock-driven, but it would have become a real hole the moment Stage 3 wires
 * them to live queries, and the fix belongs here rather than in a to-do.
 *
 * RLS is still the enforcement point for the data itself — `is_admin()` gates
 * every admin-visible row. This is the second lock, not the only one: it stops
 * the route rendering at all, so a student never sees an admin shell full of
 * empty tables and assumes something is broken.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Send a non-admin to their own dashboard rather than a 403 — an admin URL
  // that behaves differently for students is itself a hint worth not giving.
  if (profile?.role !== 'admin') redirect('/dashboard');

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
