# Flag Skool

## What this is

A paid AI education platform selling recorded and live cohort courses to
Nigerian students, built by Mustang (Solarin Akintunde Oluwatobi), founder of
FlagIQ and instructor to 750+ students.

The visual layer was generated in Google AI Studio and is largely finished. My
job in this repo is the engineering: migrate to Next.js, build the schema and
row-level security, wire Paystack, sign Bunny video URLs, implement the
progress and completion engine, wire transactional and behavioural email, and
deploy.

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

- Next.js 14 App Router, TypeScript
- Tailwind CSS, theme driven entirely by `/config/flagskool.config.ts`
- Motion (`motion`) — transform and opacity only, always behind reduced-motion
- Supabase — Postgres, Auth, Storage, RLS
- Bunny Stream — video, token-authenticated
- Paystack — Naira, one-time payments only, no subscriptions
- Resend — transactional and behavioural email
- Vercel

## Contracts — do not break these

- `/types/index.ts` — the data model. The schema must match it exactly. Change
  the types only with a deliberate reason, and update the schema in the same
  commit.
- `/config/flagskool.config.ts` — every instance-specific string, colour, price,
  and asset path. **Never hardcode these into a component.** This file is what
  makes the build reusable as a second school later.
- `/lib/data-access.ts` — the only seam between UI and database. Replace the
  bodies with real queries; do not change the signatures.

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
if a script dies confusingly.

Local dev runs on **port 3001**; 3000 is occupied by another project.

```bash
npm run dev
npm run build          # must pass before any commit
npm run lint           # tsc --noEmit

npm run db:push        # apply migrations to the linked remote project
npm run db:types       # regenerate types/database.ts from the live schema
npm run rls:attack     # the paywall acceptance test — must stay 14/14
ALLOW_TEST_SEED=1 npm run seed:test
```

The Supabase CLI is installed globally (`~/.local/bin/supabase`), so these are
plain `supabase`, not `npx supabase`. Never pass `--local` to `gen types` and
never run `supabase db reset`: the first needs the Docker stack this project
deliberately does not use, and the second drops the remote production database.

## Current state

**Backend is live and verified.** Supabase project `dgyfjwnyzxfvmhzkevaw` has
all five migrations applied — schema, RLS, curriculum seed, and the auth
trigger. Auth is wired end to end, and the RLS attack suite passes 14/14.

**The UI is still mock-driven.** All 29 functions in `/lib/data-access.ts` still
return values from `lib/mock-data.ts`. Connecting that seam to the real database
is Stage 2/3 work; the signatures do not change.

See [HANDOFF.md](HANDOFF.md) for the full state, the gotchas that already cost
real time, and where to pick up.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
