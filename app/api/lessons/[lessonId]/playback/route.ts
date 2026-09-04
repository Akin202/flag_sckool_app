import { NextResponse } from 'next/server';
import { config } from '@/config/flagskool.config';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signPlaylistUrl } from '@/lib/bunny/token';

/**
 * Issue a short-lived signed HLS manifest URL for one lesson.
 *
 * Same split as app/api/resources/[id]/download/route.ts, for the same reason:
 *
 *   - The **entitlement check is the RLS-scoped read**. `lessons_read_entitled`
 *     already encodes "published, and either a free preview or covered by an
 *     enrollment". Re-implementing that here would be a second copy of the
 *     policy, free to drift from the real one. No row means no access.
 *   - The **video id read** then uses the service role, because
 *     `lessons.bunny_video_id` is revoked at the column level from every client
 *     role — including an enrolled student's. That revoke is deliberate: the
 *     raw id must never reach the browser, only a signed short-lived URL does.
 *
 * The client refreshes this before `expiresAt` rather than holding one long
 * URL, so a copied link dies in minutes instead of outliving the lesson.
 */
/**
 * How long the signed URL should live.
 *
 * The short TTL in config is the right answer *because* the player re-signs
 * mid-playback: hls.js lets us rewrite the token on every segment request, so
 * a two-hour lesson plays fine on a five-minute token and a copied link still
 * dies in five minutes.
 *
 * Safari and iOS have no MSE, so they play the manifest natively and there is
 * no request hook to rewrite — the token has to outlive the lesson or playback
 * dies mid-way. Detecting that here rather than taking a flag from the client
 * matters: a query parameter would let any caller ask for the long URL and
 * quietly erase the short TTL for everyone.
 *
 * UA sniffing is unreliable, and that is acceptable here — this only picks a
 * duration. Entitlement is decided by RLS above, and guessing wrong costs a
 * re-buffer, not access.
 */
function ttlSecondsFor(request: Request, durationSeconds: number | null): number {
  const ua = request.headers.get('user-agent') ?? '';
  const isAppleNativeHls = /iPad|iPhone|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrom(e|ium)/.test(ua));

  if (!isAppleNativeHls) return config.video.signedUrlTtlSeconds;

  // The whole lesson, plus room for pausing partway through.
  const NATIVE_HLS_GRACE_SECONDS = 3600;
  return (durationSeconds ?? 0) + NATIVE_HLS_GRACE_SECONDS;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  const supabase = await createClient();

  // getUser(), never getSession(): getSession() trusts the cookie as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in callers only — including for the free preview, which reads as a
  // surprise until you look at the schema.
  //
  // `lessons_read_entitled` names `to anon, authenticated`, which suggests a
  // logged-out visitor can read a published free preview. They cannot: the
  // policy calls `user_has_sku()`, and that function is deliberately revoked
  // from `anon` (migration 20260825000002). So an anon select on `lessons`
  // raises 42501 "permission denied for function user_has_sku" instead of
  // returning a row — the OR does not short-circuit around it.
  //
  // That revoke is the right call, not a bug to route around: it stops a
  // logged-out caller probing entitlements. The public surface is the
  // `curriculum` view, which is security_invoker = false precisely so anon
  // never touches the policy. Without this gate the route would answer every
  // anonymous request with a 500.
  //
  // Consequence, and it is a real gap: **playback for a logged-out visitor on
  // the landing page does not work yet.** Wiring FreePreviewSection and
  // PreviewVideoModal needs a definer-backed path for free-preview videos, the
  // same shape as `curriculum` — a migration, and the same Stage 3 work the
  // comments feature is waiting on. Granting anon EXECUTE on user_has_sku
  // would be the wrong fix.
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  // Name the columns. `select('*')` on `lessons` is rejected wholesale for
  // client roles because of the bunny_video_id revoke, which would make this
  // route fail closed for the wrong reason and pass a deny-only test.
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, duration_seconds')
    .eq('id', lessonId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }

  // No row means the lesson does not exist, is unpublished, or the caller is
  // not entitled to it. Do not distinguish — that difference is enumerable.
  if (!lesson) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: privileged, error: adminError } = await admin
    .from('lessons')
    .select('bunny_video_id')
    .eq('id', lessonId)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }

  if (!privileged?.bunny_video_id) {
    // No Bunny account existed when this route was written, so an unmapped
    // lesson is the expected path for a while. Say so plainly rather than
    // returning a dead URL the student would blame on their connection.
    return NextResponse.json(
      { error: 'This lesson has no video attached yet.' },
      { status: 409 }
    );
  }

  try {
    const { url, expiresAt } = signPlaylistUrl(
      privileged.bunny_video_id,
      ttlSecondsFor(request, lesson.duration_seconds)
    );

    return NextResponse.json(
      { url, expiresAt, durationSeconds: lesson.duration_seconds },
      // The URL is per-user and expires in minutes. Caching it anywhere —
      // browser or CDN — would hand one student's token to the next.
      { headers: { 'Cache-Control': 'no-store, private' } }
    );
  } catch (signError) {
    // Missing BUNNY_* env vars land here. 503 rather than 500: the code is
    // fine, the account is not configured yet.
    return NextResponse.json(
      {
        error: 'Video playback is not configured yet.',
        detail: signError instanceof Error ? signError.message : undefined,
      },
      { status: 503 }
    );
  }
}
