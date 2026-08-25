'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseAnonKey, supabaseUrl } from './env';

/**
 * Browser Supabase client. Carries the user's session cookie, so every query
 * it makes is constrained by row level security.
 *
 * TODO(handoff): once `supabase gen types typescript --linked > types/database.ts`
 * has run, parameterise this as createBrowserClient<Database>(...) for typed
 * table access.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
