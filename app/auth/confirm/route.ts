import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Landing point for every link Supabase emails: signup confirmation, password
 * recovery, and email-change confirmation.
 *
 * Two shapes arrive here, and both must work:
 *
 * 1. `token_hash` + `type` — the preferred path. Requires the hosted email
 *    templates to be rewritten to emit it (see HANDOFF.md § Auth email
 *    templates). This is the only cross-device-safe path: a link mailed after a
 *    laptop signup still works when opened on a phone, because nothing in the
 *    browser is needed to redeem it.
 *
 * 2. `code` — PKCE. This is what the *stock* Supabase template produces, since
 *    createBrowserClient defaults to flowType: 'pkce'. Kept as a fallback so a
 *    reset or un-customised template degrades to a working login instead of a
 *    dead end. It only succeeds in the browser that started the flow, because
 *    the PKCE verifier lives in that browser's cookie.
 *
 * Exchanging either one here — server-side — sets the session cookie, which is
 * what lets /reset simply call updateUser() without handling tokens itself.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Same-origin relative paths only — otherwise a crafted confirmation link
  // becomes an open redirect carrying a freshly minted session.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('next');

  const expired = () => {
    redirectTo.pathname = '/login';
    redirectTo.searchParams.set('error', 'That link has expired or was already used. Request a new one.');
    return NextResponse.redirect(redirectTo);
  };

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return expired();

    redirectTo.pathname = safeNext;
    return NextResponse.redirect(redirectTo);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return expired();

    redirectTo.pathname = safeNext;
    return NextResponse.redirect(redirectTo);
  }

  // Neither shape present. Reaching here does NOT mean the account is broken —
  // Supabase's own /auth/v1/verify hop has already set email_confirmed_at by the
  // time the browser lands on this route, so the address is almost certainly
  // confirmed and the password will just work. Say so, rather than sending the
  // user off to debug an account that is fine.
  redirectTo.pathname = '/login';
  redirectTo.searchParams.set(
    'error',
    'We could not read that confirmation link, but your email is most likely already confirmed. Try signing in below.',
  );
  return NextResponse.redirect(redirectTo);
}
