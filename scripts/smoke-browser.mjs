/**
 * Browser smoke test — drives the running dev server in headless Chrome over
 * the DevTools Protocol.
 *
 * Deliberately has no Playwright dependency: Chrome is already on the machine
 * and Node 22 ships a native WebSocket client, so this adds nothing to the
 * install. It exists because curl cannot verify this app — every student view
 * fetches in `useEffect`, so an HTTP 200 says the server responded and nothing
 * about whether real data rendered.
 *
 * Start Chrome first:
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     --headless=new --remote-debugging-port=9222 --no-first-run \
 *     --user-data-dir=/tmp/flagskool-chrome about:blank &
 *
 * Then, against seeded test students (ALLOW_TEST_SEED=1 npm run seed:test):
 *   EMAIL=chidi.okonkwo@flagskool.test EXPECT_COMPLETE=11 EXPECT_LOCKED=0 npm run smoke:browser
 *   EMAIL=amara.nwosu@flagskool.test   EXPECT_COMPLETE=4  EXPECT_LOCKED=1 npm run smoke:browser
 *   EMAIL=funke.adeyemi@flagskool.test EXPECT_COMPLETE=15 EXPECT_LOCKED=0 npm run smoke:browser
 */
const BASE = process.env.BASE || 'http://localhost:3001';
const EMAIL = process.env.EMAIL || 'chidi.okonkwo@flagskool.test';
const PASSWORD = 'TestStudent!2026';
const CDP = 'http://127.0.0.1:9222';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const tabs = await (await fetch(`${CDP}/json/list`)).json();
      const page = tabs.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

class Session {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const s = new Session(ws);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const p = s.pending.get(msg.id);
      if (p) { s.pending.delete(msg.id); msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result); }
    };
    return s;
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''));
    return r.result.value;
  }
  async goto(url, settleMs = 2500) {
    await this.send('Page.navigate', { url });
    await sleep(settleMs);
  }
  text() { return this.eval('document.body.innerText'); }
  async waitForText(re, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    let last = '';
    while (Date.now() < deadline) {
      last = await this.text();
      if (re.test(last)) return last;
      await sleep(300);
    }
    return last;
  }
  url()  { return this.eval('location.pathname + location.search'); }
}

// React controlled inputs ignore a plain .value assignment — the native setter
// plus a dispatched input event is what makes React see the change.
const SET_INPUT = `
(function(sel, val){
  const el = document.querySelector(sel);
  if (!el) return 'MISSING:' + sel;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
})`;

const results = [];
function check(label, ok, detail) {
  results.push(ok);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);
}

const wsUrl = await connect();
const s = await Session.open(wsUrl);
await s.send('Page.enable');
await s.send('Runtime.enable');

// ---------- 1. Landing page, logged out ----------
await s.goto(`${BASE}/`, 3500);
const landing = await s.text();
check('landing renders seeded curriculum',
  landing.includes('Automation with n8n') && landing.includes('RAG in Practice'),
  landing.includes('Automation with n8n') ? 'real module titles present' : 'MOCK OR EMPTY');
check('landing shows no mock-only module',
  !landing.includes('Shipping Products —') ,
  'ok');

// ---------- 2. Log in ----------
await s.goto(`${BASE}/login`, 2500);
console.log(`\n  logging in as ${EMAIL}\n`);
const e1 = await s.eval(`${SET_INPUT}('input[type="email"]', ${JSON.stringify(EMAIL)})`);
const e2 = await s.eval(`${SET_INPUT}('input[type="password"]', ${JSON.stringify(PASSWORD)})`);
if (e1 !== 'ok' || e2 !== 'ok') { console.log('  input fill failed:', e1, e2); }
await s.eval(`(function(){ const f=document.querySelector('form'); const b=f&&f.querySelector('button[type="submit"]')||document.querySelector('button[type="submit"]'); if(b){b.click(); return 'clicked';} return 'no submit button'; })()`);
await sleep(6000);

const afterLogin = await s.url();
check('login redirects away from /login', !afterLogin.startsWith('/login'), `now at ${afterLogin}`);

// ---------- 3. Dashboard ----------
await s.goto(`${BASE}/dashboard`, 5000);
const dash = await s.text();
check('dashboard is not the login page', !(await s.url()).startsWith('/login'), `at ${await s.url()}`);
// Parameterised per student — a hardcoded 11 only ever described chidi.
const EXPECT_COMPLETE = Number(process.env.EXPECT_COMPLETE ?? 11);
const COURSE_COMPLETE = EXPECT_COMPLETE === 15;
check(COURSE_COMPLETE ? 'finished course shows a completion state' : 'dashboard shows Continue CTA',
  COURSE_COMPLETE ? !/Continue where you left off/i.test(dash) : /Continue where you left off/i.test(dash),
  COURSE_COMPLETE ? 'no resume card, as expected' : 'CTA rendered');
const dashSettled = await s.waitForText(/of\s+\d+\s+lessons?\s+complete/i);
// Parse the numbers rather than pattern-matching: a regex built inside a
// template literal silently turns \b into a backspace and \s into "s".
const m = dashSettled.match(/(\d+)\s+of\s+(\d+)\s+lessons?\s+complete/i);
const countStr = m ? m[0] : 'not rendered';
check('dashboard shows real completion count',
  Boolean(m) && Number(m[1]) === EXPECT_COMPLETE && Number(m[2]) === 15,
  countStr);
check('dashboard is not in an error state', !/Error loading progress/i.test(dash),
  /Error loading progress/i.test(dash) ? 'ERROR STATE' : 'clean');

// ---------- 4. Resume redirect ----------
await s.goto(`${BASE}/learn`, 5000);
const learnUrl = await s.url();
const isUuid = /\/learn\/[0-9a-f]{8}-[0-9a-f]{4}-/.test(learnUrl);
check(COURSE_COMPLETE ? '/learn falls back to /dashboard when finished' : '/learn resolves to a real lesson uuid',
  COURSE_COMPLETE ? learnUrl.startsWith('/dashboard') : isUuid,
  learnUrl);
const learn = await s.text();
check('lesson player rendered', COURSE_COMPLETE || (learn.length > 200 && !/Error/i.test(learn.slice(0, 400))),
  COURSE_COMPLETE ? 'n/a (course finished)' : `${learn.length} chars of content`);

// ---------- 4b. Playback authorization, as a real signed-in student ----------
const lockedExpectedEarly = process.env.EXPECT_LOCKED === '1';
// Called from page context so the request carries the session cookies. This is
// the half verify-playback-route.ts cannot reach: it runs logged out, and the
// entitled path is the one that decides whether a paying student sees video.
if (!COURSE_COMPLETE && isUuid) {
  const lessonId = learnUrl.split('/learn/')[1].split(/[?#]/)[0];

  const playback = await s.eval(`
    fetch('/api/lessons/${lessonId}/playback')
      .then(r => r.json().then(b => JSON.stringify({ status: r.status, body: b })))
      .catch(e => JSON.stringify({ status: 0, body: { error: String(e) } }))
  `);
  const { status, body } = JSON.parse(playback);

  // 200 once Bunny is wired and the GUID is synced; 409 while bunny_video_id
  // is empty; 503 while BUNNY_* is unset. All three mean authorization passed.
  // 401/404 mean it did not, which is the actual regression to catch.
  check('entitled student clears the playback authorization gate',
    [200, 409, 503].includes(status),
    `${status} ${body.error || 'signed URL issued'}`);

  if (status === 200) {
    check('playback URL is a directory-token HLS manifest',
      typeof body.url === 'string' && body.url.includes('/bcdn_token=') && body.url.endsWith('playlist.m3u8'),
      body.url ? body.url.slice(0, 72) + '…' : 'no url');
    check('playback URL expires, and soon',
      Number.isFinite(body.expiresAt) && body.expiresAt - Math.floor(Date.now() / 1000) <= 7200,
      `${body.expiresAt - Math.floor(Date.now() / 1000)}s of life`);
  } else {
    check('no signed URL issued while Bunny is unconfigured',
      typeof body.url !== 'string',
      body.error || 'none');
  }

  const unknown = await s.eval(`
    fetch('/api/lessons/00000000-0000-0000-0000-000000000000/playback')
      .then(r => JSON.stringify({ status: r.status }))
      .catch(() => JSON.stringify({ status: 0 }))
  `);
  check('unknown lesson id is a 404 for a signed-in student',
    JSON.parse(unknown).status === 404,
    `${JSON.parse(unknown).status}`);

  // The case that actually matters: REAL lessons this student is not entitled
  // to. The outline deliberately lists locked lessons, so their ids are right
  // there in the DOM — probe every one and confirm the paywall holds per
  // lesson, not just in aggregate. A bogus uuid only ever proved 404 routing.
  const probe = await s.eval(`
    (async () => {
      const ids = [...new Set([...document.querySelectorAll('[data-lesson-id]')]
        .map(el => el.getAttribute('data-lesson-id'))
        .filter(id => id && /^[0-9a-f]{8}-/.test(id)))];
      const out = [];
      for (const id of ids) {
        try {
          const r = await fetch('/api/lessons/' + id + '/playback');
          const b = await r.json().catch(() => ({}));
          out.push({ id, status: r.status, url: typeof b.url === 'string' });
        } catch { out.push({ id, status: 0, url: false }); }
      }
      return JSON.stringify(out);
    })()
  `);
  const probed = JSON.parse(probe);
  const denied = probed.filter((r) => r.status === 404);
  const allowed = probed.filter((r) => [200, 409, 503].includes(r.status));

  check('every lesson in the outline resolves to allow or deny, nothing else',
    probed.length > 0 && probed.every((r) => [200, 404, 409, 503].includes(r.status)),
    `${probed.length} probed: ${allowed.length} allowed, ${denied.length} denied`);

  check('no lesson ever leaks a signed URL while Bunny is unconfigured',
    probed.every((r) => !r.url),
    'none leaked');

  if (lockedExpectedEarly) {
    check('a student with a locked module is denied at least one real lesson',
      denied.length > 0,
      `${denied.length} lesson(s) denied`);
  } else {
    check('a fully entitled student is denied no real lesson',
      denied.length === 0,
      `${denied.length} lesson(s) denied`);
  }
}

// ---------- 5. Vault ----------
await s.goto(`${BASE}/vault`, 4000);
const vault = await s.text();
check('vault module chips derive from real modules',
  !/Mod 1: Foundations/.test(vault),
  /Mod 1: Foundations/.test(vault) ? 'STILL HARDCODED' : 'derived (or empty)');

// ---------- 6. Account ----------
await s.goto(`${BASE}/account`, 4000);
const account = await s.text();
// innerText excludes <input> values, and the email is a form field — read it
// off the element rather than the rendered text.
const emailValue = await s.eval(`(document.querySelector('input[type="email"]')||{}).value || ''`);
check('account shows the real signed-in email', emailValue === EMAIL, emailValue || '(empty)');
check('account no longer prints the mock id', !account.includes('usr-4911'), 'ok');

// The paywall, as the student actually sees it.
await s.goto(`${BASE}/dashboard`, 1000);
const lockedExpected = process.env.EXPECT_LOCKED === '1';
// Wait for the module list to actually render before judging lock state.
const dash2 = await s.waitForText(/lessons?\s*complete/i);
const hasUpgrade = /Upgrade/i.test(dash2) && /Locked/i.test(dash2);
check(lockedExpected ? 'locked module shows an upgrade path' : 'no locked modules for cohort',
  hasUpgrade === lockedExpected,
  hasUpgrade ? 'Upgrade affordance present' : 'no lock shown');

const shot = await s.send('Page.captureScreenshot', { format: 'png' });
const fs = await import('node:fs');
fs.writeFileSync(process.env.SHOT || '/tmp/flagskool-account.png', Buffer.from(shot.data, 'base64'));

const failed = results.filter((r) => !r).length;
console.log(`\n  ${failed === 0 ? 'ALL BROWSER CHECKS PASSED' : failed + ' BROWSER CHECK(S) FAILED'}\n`);
process.exit(failed === 0 ? 0 : 1);
