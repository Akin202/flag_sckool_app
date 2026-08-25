import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { supabaseAnonKey, supabaseUrl } from './env';

/**
 * Server Supabase client for React Server Components, route handlers, and
 * server actions. Uses the anon key and the caller's session, so row level
 * security applies exactly as it does in the browser.
 *
 * `cookies()` is async in Next 15+, hence the await.
 *
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session on every request, so ignoring this
          // is safe — it is the pattern Supabase documents.
        }
      },
    },
  });
}

/**
 * The authenticated user, or null.
 *
 * Always this, never getSession(), in server code: getSession() returns
 * whatever is in the cookie without verifying it, so a forged cookie passes.
 * getUser() revalidates against the Supabase auth server.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
