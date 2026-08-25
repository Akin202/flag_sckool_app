import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`, and the
 * exported function from `middleware` to `proxy`. Every Supabase SSR guide
 * still says middleware.ts; a file by that name here is silently ignored,
 * which would leave the auth guard never running. See
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 *
 * What this does:
 *   1. Refreshes the Supabase session cookie on every matched request.
 *   2. Redirects logged-out visitors away from student and admin surfaces.
 *
 * What this is NOT: the security boundary. Middleware/proxy bypasses have
 * shipped as CVEs in Next before, and the Next 16 docs themselves advise
 * against depending on this layer. The real paywall is row level security in
 * Postgres, re-checked by each server component with getUser(). Treat the
 * redirect below as a user-experience convenience.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/learn', '/vault', '/account', '/admin'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser(), never getSession() — getSession trusts the cookie unverified.
  // This call also performs the token refresh, so it must run before the
  // early return below or sessions silently expire mid-session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    // Where to send them once they have signed in.
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Returning `response` (not a fresh NextResponse) is required: it carries
  // the refreshed auth cookies set in setAll above.
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. The session still needs
     * refreshing on public pages, so this is deliberately broad rather than
     * scoped to PROTECTED_PREFIXES.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};
