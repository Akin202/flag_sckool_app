/**
 * Environment access for the Supabase layer.
 *
 * Every read goes through here so a missing variable fails loudly at the call
 * site with a message naming the variable, rather than surfacing later as an
 * opaque "Invalid API key" from PostgREST.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in the Supabase values.`,
    );
  }
  return value;
}

/** Safe for the browser. Inlined into the client bundle by Next. */
export function supabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Safe for the browser. RLS is what constrains it. */
export function supabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * SERVER ONLY. Never call this from a module that a client component imports.
 * lib/supabase/admin.ts is the only intended caller and it carries a
 * `server-only` guard.
 */
export function supabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}
