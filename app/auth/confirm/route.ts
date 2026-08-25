import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Landing point for every link Supabase emails: signup confirmation, password
 * recovery, and email-change confirmation.
 *
 * Supabase sends a one-time token_hash. Exchanging it here — server-side —
 * sets the session cookie, which is what lets /reset simply call updateUser()
 * without handling tokens itself.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  // Same-origin relative paths only — otherwise a crafted confirmation link
  // becomes an open redirect carrying a freshly minted session.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  if (!tokenHash || !type) {
    redirectTo.pathname = '/login';
    redirectTo.searchParams.set('error', 'That confirmation link is incomplete. Request a new one.');
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    redirectTo.pathname = '/login';
    redirectTo.searchParams.set('error', 'That link has expired or was already used. Request a new one.');
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.pathname = safeNext;
  return NextResponse.redirect(redirectTo);
}
