import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseServiceRoleKey, supabaseUrl } from './env';

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * The `server-only` import above is the guard: importing this module from
 * anything that ends up in a client component is a BUILD error, not a runtime
 * leak. Do not remove it, and do not re-export anything from here through a
 * module a client component touches.
 *
 * Legitimate callers, all server-side:
 *   - the verified Paystack webhook, which is the ONLY thing allowed to create
 *     an enrollment
 *   - Bunny playback-URL signing, after an entitlement check
 *   - admin queries that deliberately read across all users
 *
 * If you are reaching for this to "make a query work", the answer is almost
 * always a missing RLS policy instead.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
