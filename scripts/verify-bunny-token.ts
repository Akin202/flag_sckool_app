/**
 * Golden-vector test for the Bunny CDN URL signer.
 *
 * The vectors below were produced by BunnyWay's own reference implementation
 * (github.com/BunnyWay/BunnyCDN.TokenAuthentication, nodejs/token.js) run with
 * the fake key and pinned expiry in this file, and verified byte-identical
 * against lib/bunny/token.ts.
 *
 * They are frozen here rather than re-fetched because the point of the test is
 * to catch *our* signing math drifting. A signature bug does not fail loudly —
 * it produces a perfectly well-formed URL that Bunny answers with 403, which
 * then gets debugged as a credentials problem or a network problem. This is
 * the cheapest possible place to catch it.
 *
 * Needs no credentials and no network. Run: npm run verify:bunny
 */
process.env.BUNNY_CDN_HOSTNAME ??= 'vz-21bd3842-779.b-cdn.net';
process.env.BUNNY_CDN_TOKEN_KEY ??= 'test-security-key-not-real';

const { signPlaylistUrl } = await import('../lib/bunny/token.ts');

interface Vector {
  videoId: string;
  expires: number;
  expected: string;
}

const HOST = 'vz-21bd3842-779.b-cdn.net';
const KEY = 'test-security-key-not-real';

const VECTORS: Vector[] = [
  {
    videoId: '023136c7-cd84-468c-8514-71088232fa1f',
    expires: 1598024587,
    expected:
      'https://vz-21bd3842-779.b-cdn.net/bcdn_token=HS256-bMXJMJvFcnB24khpTR5A9yDgc_tBQ1AnMegRr5-IVBY&token_path=%2F023136c7-cd84-468c-8514-71088232fa1f%2F&expires=1598024587/023136c7-cd84-468c-8514-71088232fa1f/playlist.m3u8',
  },
];

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) {
    console.log(`        expected: ${String(expected)}`);
    console.log(`        actual:   ${String(actual)}`);
  }
}

// The signer takes a TTL, not an absolute expiry, so pin the clock to make the
// frozen vectors reproducible.
const realNow = Date.now;

for (const vector of VECTORS) {
  Date.now = () => (vector.expires - 3600) * 1000;
  const { url, expiresAt } = signPlaylistUrl(vector.videoId, 3600);
  Date.now = realNow;

  check(`signature matches reference for ${vector.videoId.slice(0, 8)}`, url, vector.expected);
  check(`expiresAt is unix seconds for ${vector.videoId.slice(0, 8)}`, expiresAt, vector.expires);
}

// The directory token is the whole reason segments resolve. If the token ever
// moves back into the query string, HLS breaks in a way that looks like a
// stall rather than a 403, so assert the shape explicitly.
const sample = signPlaylistUrl('abc-123', 300).url;
check('token sits in the path, not the query', sample.includes('/bcdn_token='), true);
check('token scope covers the whole video directory', sample.includes('token_path=%2Fabc-123%2F'), true);
check('manifest is the signed target', sample.endsWith('/abc-123/playlist.m3u8'), true);
check('no query string at all', sample.includes('?'), false);

// A missing key must throw rather than sign with "undefined".
delete process.env.BUNNY_CDN_TOKEN_KEY;
let threw = false;
try {
  signPlaylistUrl('abc-123', 300);
} catch {
  threw = true;
}
check('missing BUNNY_CDN_TOKEN_KEY throws', threw, true);
process.env.BUNNY_CDN_TOKEN_KEY = KEY;

// A pasted "https://host/" from the dashboard must not corrupt the signed path.
process.env.BUNNY_CDN_HOSTNAME = `https://${HOST}/`;
check(
  'pasted scheme and trailing slash are tolerated',
  signPlaylistUrl('abc-123', 300).url.startsWith(`https://${HOST}/bcdn_token=`),
  true,
);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
