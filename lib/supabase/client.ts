'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { supabaseAnonKey, supabaseUrl } from './env';

/**
 * Browser Supabase client. Carries the user's session cookie, so every query
 * it makes is constrained by row level security.
 *
 * Typed against types/database.ts, which is generated from the live schema by
 * `npm run db:types`. Regenerate it after every migration — a stale file makes
 * the compiler agree with a schema that no longer exists.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
