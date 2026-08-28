/**
 * The Supabase client type every query in `lib/db` accepts.
 *
 * Queries take the client as an argument instead of reaching for one, so the
 * same code serves both callers: the browser (where `data-access.ts` runs,
 * carrying the user's session cookie) and server components like `/learn`,
 * which must resolve a resume target before rendering.
 *
 * Both clients are anon-key clients, so RLS applies identically either way.
 * Neither is the service-role client — that one lives in `lib/supabase/admin.ts`
 * and never appears here.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type Db = SupabaseClient<Database>;
