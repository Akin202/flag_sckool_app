# Flag Skool

> Canonical context for **every** coding agent on this repo — Claude Code,
> Antigravity, Codex, Cursor, and anything else that reads `AGENTS.md`.
> `CLAUDE.md` is a pointer to this file. Do not fork product rules into a
> tool-specific file; they drift, and then two agents believe different things.

## What this is

A paid AI education platform selling recorded and live cohort courses to
Nigerian students, built by Mustang (Solarin Akintunde Oluwatobi), founder of
FlagIQ and instructor to 750+ students.

The visual layer was generated in Google AI Studio and is largely finished. The
engineering work in this repo is: the schema and row-level security, Paystack,
signed Bunny video URLs, the progress and completion engine, transactional and
behavioural email, and deploy.

## The actual product

This is not "video behind a paywall" — Google Drive already does that for free.
**The job of this application is to make students finish the course.**

₦80,000–₦100,000 is serious money for the target buyer. The worst commercial
outcome is not piracy. It is a student who pays, watches two lessons, drifts,
and privately concludes Flag Skool didn't work. They don't request a refund.
They never buy again and never refer anyone. Silent churn is the primary
business risk, and every feature is justified by whether it moves completion.

Two audiences:

1. **Students** — mid-tier Android, Nigerian mobile data, watching two-hour
   lessons in fragments over several days, often late at night.
   **The lesson player is the highest-stakes surface in the app.** Resume,
   progress, and data-saver are not features; they are the product.
2. **Admin (one person, the founder)** — checking whether payments landed and
   who has stalled. Density over elegance. The admin area is deliberately not
   themed. Do not "improve" it toward the student aesthetic.

## Stack

- Next.js 16 App Router, TypeScript, Turbopack
- Tailwind CSS v4, theme driven entirely by `/config/flagskool.config.ts`
- Motion (`motion`) — transform and opacity only, always behind reduced-motion
- Supabase — Postgres, Auth, Storage, RLS
- Bunny Stream — video, token-authenticated *(account not created yet)*
- Paystack — Naira, one-time payments only, no subscriptions
- Resend — transactional and behavioural email
- Vercel

## Contracts — do not break these

- `/types/index.ts` — the data model the UI consumes. These are **view models,
  not row shapes**; the derivation from database rows lives in `lib/db/mappers.ts`.
  Change them only with a deliberate reason.
- `/config/flagskool.config.ts` — every instance-specific string, colour, price,
  and asset path. **Never hardcode these into a component.** This file is what
  makes the build reusable as a second school later.
- `/lib/data-access.ts` — the only seam between UI and database. Replace the
  bodies with real queries; **do not change the signatures**, including the
  dev-variant parameters. Every view component depends on them.

## Conventions

- `// TODO(handoff):` marks every spot where real logic belongs. Grep for them.
- Presentational components stay pure — props in, JSX out. Data fetching lives
  in server components or `data-access.ts`, never in a UI component.
- All money is kobo, everywhere, always. Format only through `koboToNaira`.
- Every table carries `org_id`. There is exactly one organization row today.
  This exists so multi-tenant is a weekend later rather than a rewrite. Do not
  remove it because it looks redundant.

## Hard constraints

- **Money:** enrollment is created ONLY by the verified Paystack webhook. The
  browser redirect from Paystack grants nothing. Anyone can hit a redirect URL;
  a shortcut here costs ₦80,000 per head.
- **Video:** Bunny URLs are signed server-side with a short TTL, issued only
  after an enrollment check. The Bunny token key must never reach the client
  bundle.
- **Data cost:** the player defaults to 480p, never auto. Thirteen two-hour
  lessons at 720p is ~20GB per student on Nigerian mobile data — a real
  fraction of what they paid, spent on bandwidth. Do not change this default.
- **Performance:** LCP under 2.5s on Slow 4G with 4x CPU throttle. Measure it;
  don't assert it.
- **Accessibility:** WCAG AA. Flag Red (#CA3A32) on Ink Deep (#030617) is the
  risky pairing — report the actual ratio.
- **Motion:** animate only `transform` and `opacity`. Every animation wrapped in
  the reduced-motion check. No motion on the player screen.
- **Link previews:** traffic arrives from Telegram and X. Neither crawler runs
  JavaScript, so OG tags must be server-rendered into the initial HTML.

## Commands

**Node 22 is required**, not optional. `@supabase/supabase-js` declares
`engines.node >= 22`, and the `rls:attack` / `seed:test` scripts fail on Node 20
with `bad option: --experimental-strip-types`. `.nvmrc` pins it — run `nvm use`
if a script dies confusingly. **Check `node -v` before debugging anything else.**

```bash
npm run dev            # port 3001 by default; PORT=3002 npm run dev to override
npm run build          # must pass before any commit
npm run lint           # tsc --noEmit

npm run db:push        # apply migrations to the linked remote project
npm run db:types       # regenerate types/database.ts from the live schema
npm run rls:attack     # the paywall acceptance test — must stay 14/14
npm run verify:reads   # the read-path acceptance test — must be ALL CHECKS PASSED
ALLOW_TEST_SEED=1 npm run seed:test   # test students, all @flagskool.test
```

The Supabase CLI is installed globally (`~/.local/bin/supabase`), so these are
plain `supabase`, not `npx supabase`.

## Gotchas that have already cost real time

Read these before debugging. Each one looked correct and did nothing.

- **Next 16 renamed `middleware.ts` → `proxy.ts`.** The exported function is
  `proxy`, it defaults to the Node.js runtime, and setting `runtime` throws.
  Every Supabase SSR tutorial online says `middleware.ts`; following one
  produces a file Next silently ignores — an auth guard that never runs. The
  build output printing `ƒ Proxy (Middleware)` is how you know it is wired.
- **`REVOKE SELECT (column)` is a silent no-op** while the role holds table-level
  `SELECT`, which Supabase grants by default. Hiding `lessons.bunny_video_id`
  required a table-level `REVOKE` then a column-level `GRANT` of everything else.
- **Consequence: `select('*')` on `lessons` errors for client roles.** Name your
  columns. A star query in a test makes lesson attacks "pass" because the star
  was rejected, not because the row policy denied access.
- **`lessons.bunny_video_id` is unreadable by any client role**, even an enrolled
  one. Mappers supply `''` for `Lesson.bunnyVideoId`. That is correct, not a bug.
- **Never run `supabase db reset`** — it drops the remote database, and this
  project becomes production. **Never pass `--local` to `gen types`**; it assumes
  a Docker stack this project deliberately does not use.
- **Supabase's direct DB host is IPv6-only** and this machine has no IPv6 route.
  The CLI resolves this itself via the pooler. If it ever does not, use **port
  5432 (session mode)**, not 6543 — transaction mode breaks DDL migrations.
- **Docker is not used anywhere.** There is no local Supabase stack.
- **`data-access.ts` runs in the browser.** Every `src/views/*` is imported by a
  `'use client'` screen, so the whole seam is client-bundled. Queries in
  `lib/db/*` therefore accept an **injectable client** (`lib/db/client.ts`) and
  default to the browser one. A server component — `app/learn/page.tsx` is the
  only one today — passes `await createClient()` from `lib/supabase/server`
  instead. Calling the browser factory during a server render is a hard build
  error, not a warning, and it only shows up at prerender time.
- **supabase-js infers row types from the `select()` *string literal*.**
  Building that string with `+` collapses it to `string` and silently loses
  every column type. Keep each select on one literal, however long.

## Security model

**RLS is the paywall. `proxy.ts` is not.** The proxy only redirects logged-out
users for UX. Every server component additionally re-checks with `getUser()` —
never `getSession()`, which returns whatever is in the cookie without verifying it.

`lib/supabase/admin.ts` is the **service role** client and bypasses RLS entirely.
It opens with `import 'server-only'`, so importing it from anything reaching a
client component is a build error rather than a runtime leak. If you are reaching
for the admin client to "make a query work", the answer is almost always a
missing RLS policy instead.

`npm run rls:attack` is the acceptance gate: 9 attacks that must return zero rows
and 5 controls that must return rows. **The controls matter as much as the
attacks** — a policy that denies everything passes a deny-only test while
breaking the product. If you change any policy, re-run this and keep it 14/14.

---

## Multi-agent operating rules

Several agents work this repo concurrently. These rules exist because the
failure modes are silent.

### One worktree, one branch, one port per agent

Worktrees are not a stylistic preference here. **Next 16 refuses to start a
second dev server in the same directory** — it detects the running one and
exits with "Another next dev server is already running". Separate directories
are what make concurrent agents possible at all.

Already created (`git worktree list` to confirm):

| Agent | Directory | Branch | Port |
|---|---|---|---|
| Claude Code | `flag_sckool_app` | `main` | 3001 |
| Antigravity | `flag_sckool_app-antigravity` | `agent/antigravity` | 3002 |
| Codex | `flag_sckool_app-codex` | `agent/codex` | 3003 |

To add another:

```bash
git worktree add ../flag_sckool_app-<agent> -b agent/<agent>
cp .env.local ../flag_sckool_app-<agent>/.env.local   # gitignored — must be copied
cd ../flag_sckool_app-<agent>
npm install                                            # each worktree needs its own
sed -i '' 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:<port>|' .env.local
```

Start it with the port on the **command line**, not in `.env.local`:

```bash
PORT=3002 npm run dev
```

`npm run dev` is `next dev -p ${PORT:-3001}`, and that `${PORT}` is expanded by
the *shell* — before Next ever loads `.env.local`. A `PORT=` line in an env file
is silently ignored. `NEXT_PUBLIC_SITE_URL` must still match the port, and
**every port must be registered in Supabase → Auth → URL Configuration** or
email confirmation links bounce users to the wrong server.

Verified 2026-08-28: `:3001` and `:3002` serving simultaneously from two
worktrees, no lock conflict.

### Shared-resource rules

- **All worktrees point at the same live Supabase project `dgyfjwnyzxfvmhzkevaw`.**
  There is no staging project. A migration run in one worktree changes the
  database every other agent is reading.
- **Migration authority belongs to the Claude Code worktree only.** No other
  agent runs `db:push`, edits `supabase/migrations/`, or regenerates
  `types/database.ts`. If your change needs a schema change, say so and hand it
  over rather than writing the migration.
- `types/database.ts` is generated and committed so builds never need database
  credentials. A stale copy is worse than none — the compiler will confidently
  agree with a schema that no longer exists.

### Change rules

- Do not edit `types/index.ts`, `config/flagskool.config.ts`, or the
  **signatures** in `lib/data-access.ts` without naming it in your branch. These
  are the contracts every other agent is coding against.
- Before merging anything that touches an RLS policy: `npm run rls:attack` must
  be 14/14, and paste the output.
- Before merging anything: `npm run lint` and `npm run build` must both pass.
- Commit in logical chunks with conventional-commit messages (`feat:`, `fix:`,
  `chore:`). Do not push to `main` directly from an agent branch.

### Git remote

The remote is `git@github-akin202:Akin202/flag_sckool_app.git`. The aliased host
is deliberate — a bare `github.com` lets SSH pick a key nondeterministically
across this machine's four GitHub identities. Do not "simplify" it back.

---

## Current state

**Backend is live and verified.** Supabase project `dgyfjwnyzxfvmhzkevaw` has all
five migrations applied — schema, RLS, curriculum seed, and the auth trigger.
Auth is wired end to end, and the RLS attack suite passes 14/14.

**Stage 2a is done.** The student read path is live against Postgres — curriculum,
lessons, profile, entitlements, enrollments, course progress, resume, completion
writes, and resources all run real queries through `lib/db/*`. `npm run verify:reads`
is the acceptance gate for it, alongside `rls:attack` for the paywall.

Still deliberately mock, each keeping its `TODO(handoff)` marker:

- **Comments.** Real comments need an author name, and `profiles` RLS lets a
  student read only their own row — so this needs a definer-backed view (like
  `curriculum`) exposing author name/avatar to entitled readers. That is a
  migration, and it is Stage 3 work.
- **The whole admin surface.** Stage 3.
- **FAQs and testimonials.** No tables, and no reason for any — marketing copy.

Blocked on external accounts, not on code:

- **Bunny Stream** — no account exists, so `BUNNY_*` env vars are empty and no
  video signing or playback is wired. `Lesson.bunnyVideoId` is `''` by design.
- **Resource downloads** — `app/api/resources/[id]/download/route.ts` is written
  and enforces entitlement correctly, but no Storage bucket exists and the course
  files are not uploaded, so it returns a 503 explaining that. Set
  `SUPABASE_RESOURCES_BUCKET` once the bucket exists.
- **Paystack** — keys are set, but the money path is not built.

See [HANDOFF.md](HANDOFF.md) for the full Stage 1 record and where to pick up.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
