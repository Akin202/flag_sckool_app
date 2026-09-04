import 'server-only';

import { createHmac } from 'node:crypto';

/**
 * Bunny CDN token authentication — signing playback URLs for the lesson player.
 *
 * This is a direct port of BunnyWay's own reference signer
 * (github.com/BunnyWay/BunnyCDN.TokenAuthentication, nodejs/token.js), reduced
 * to the one case this application has: a directory token over a single
 * video's folder, no IP lock, no geo restrictions.
 *
 * Two things about Bunny's token systems are worth stating once, because both
 * have cost people afternoons:
 *
 * 1. **This is the PULL ZONE key, not the library key.** Bunny ships two
 *    unrelated token systems. "Embed View Token Authentication" secures the
 *    iframe.mediadelivery.net player and hashes SHA256(key + videoId + expires).
 *    "CDN Token Authentication" — this one — secures the direct files, and its
 *    key lives on the pull zone attached to the Stream library. Signing with
 *    the wrong key produces a well-formed URL that 403s.
 *
 * 2. **The token has to be a path prefix, not a query parameter.** A
 *    query-string token signs exactly one URL. HLS manifests reference their
 *    segments by relative path, so the player would load playlist.m3u8
 *    successfully and then 403 on every segment — which presents as "the video
 *    froze", not as an auth error. The `/bcdn_token=.../` form puts the token
 *    in the directory portion of the URL, so relative resolution carries it
 *    onto every segment automatically.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in the Bunny values.`,
    );
  }
  return value;
}

/** Stream -> library -> API -> "CDN Hostname". */
function cdnHostname(): string {
  // Tolerate a pasted "https://vz-….b-cdn.net/" — the dashboard shows it both
  // ways depending on where you copy from, and a stray scheme or slash would
  // otherwise land in the middle of the signed path.
  const raw = required('BUNNY_CDN_HOSTNAME', process.env.BUNNY_CDN_HOSTNAME);
  return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/** The pull zone's URL Token Authentication Key. SERVER ONLY. */
function tokenKey(): string {
  return required('BUNNY_CDN_TOKEN_KEY', process.env.BUNNY_CDN_TOKEN_KEY);
}

export interface SignedPlayback {
  /** Token-signed HLS manifest URL. */
  url: string;
  /** Unix seconds. The client refreshes before this passes. */
  expiresAt: number;
}

/**
 * Sign the HLS manifest for one Bunny video, as a directory token covering
 * every file under `/{videoId}/`.
 *
 * The HMAC payload order is load-bearing and comes from the reference
 * implementation: signaturePath, then expires, then the sorted signing data.
 * `token_path` appears twice on purpose — once inside the signed data and once
 * URL-encoded in the emitted URL. Dropping it from either half invalidates the
 * signature.
 */
export function signPlaylistUrl(videoId: string, ttlSeconds: number): SignedPlayback {
  if (!videoId) {
    throw new Error('signPlaylistUrl called without a videoId.');
  }

  const host = cdnHostname();
  const key = tokenKey();

  // Trailing slash matters: it is what scopes the token to the directory
  // rather than to a file named `{videoId}`.
  const tokenPath = `/${videoId}/`;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

  // Only one parameter today, but keep the sort — Bunny folds parameters in
  // alphabetical order, and a second one added later without sorting would
  // break the signature in a way that looks like a key problem.
  const parameters: Record<string, string> = { token_path: tokenPath };
  const sorted = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b));

  const signingData = sorted.map(([k, v]) => `${k}=${v}`).join('&');
  const urlData = sorted.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  const digest = createHmac('sha256', key)
    .update(tokenPath)
    .update(String(expires))
    .update(signingData)
    .digest();

  // base64url, unpadded. Node's 'base64url' encoding does exactly the +/ -> -_
  // substitution and padding strip that Bunny expects.
  const token = `HS256-${digest.toString('base64url')}`;

  return {
    url: `https://${host}/bcdn_token=${token}&${urlData}&expires=${expires}${tokenPath}playlist.m3u8`,
    expiresAt: expires,
  };
}
