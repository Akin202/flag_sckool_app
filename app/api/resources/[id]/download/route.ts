import { NextResponse } from 'next/server';
import { config } from '@/config/flagskool.config';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Issue a short-lived signed URL for a lesson or vault resource.
 *
 * Authorization and signing are deliberately split:
 *
 *   - The **entitlement check is the RLS-scoped read**. `resources` inherits
 *     the parent module's entitlement, so a student without the enrollment
 *     simply gets no row back. Re-implementing that check here would be a
 *     second copy of the policy, free to drift from the real one.
 *   - The **signing** then uses the service role, because the bucket is
 *     private and storage policies are not what gates this — the row read
 *     already did.
 *
 * The URL is minted per request with a short TTL rather than handed out with
 * the resource list, so a copied link dies quickly instead of outliving the
 * page it came from.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  // getUser(), never getSession(): getSession() trusts the cookie as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: resource, error } = await supabase
    .from('resources')
    .select('id, title, storage_path, external_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }

  // No row means either the resource does not exist or the caller is not
  // entitled to it. Do not distinguish — that difference is enumerable.
  if (!resource) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (resource.external_url) {
    return NextResponse.redirect(resource.external_url);
  }

  if (!resource.storage_path) {
    return NextResponse.json(
      { error: 'This resource has no file attached yet.' },
      { status: 409 }
    );
  }

  const bucket = process.env.SUPABASE_RESOURCES_BUCKET ?? 'resources';

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(bucket)
    .createSignedUrl(resource.storage_path, config.video.signedUrlTtlSeconds);

  if (signError || !signed) {
    // The bucket does not exist yet and the course files are not uploaded, so
    // this is the expected path today. Say so plainly rather than returning a
    // dead link the student would blame on their connection.
    return NextResponse.json(
      {
        error: 'Downloads are not available yet.',
        detail: signError?.message ?? 'Could not sign a URL for this file.',
      },
      { status: 503 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
