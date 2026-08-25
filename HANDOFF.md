# Flag Skool — engineering handoff

Written 2026-08-25, at the close of Stage 1. This is the state of the world for
a session starting cold. Read [claude.md](claude.md) first for the product
rules and hard constraints; this file covers what has actually been built,
what has been proven, and what will waste your time if you rediscover it.

Everything below was verified by running it, not by reading the code.

---

## 1. Status

| Stage | Scope | State |
|---|---|---|
| **Stage 1** | Next.js migration, schema, RLS, auth, seed | **Done and verified** |
| **Stage 2** | Paystack, Bunny signed video, real `data-access` reads | Not started |
| **Stage 3** | Progress/resume engine, comments, Resend email, admin queries | Not started |

The visual layer was already complete before Stage 1 and is unchanged.

Commits, newest first (all pushed to `origin/main`):

```
662b2c0  feat(db): generate types from the live schema and type the clients
d6c0e75  fix(db): make the bunny_video_id revoke actually take effect
84fcf8f  test: add the RLS attack suite and the test-data seeder
aa0af77  feat(auth): wire Supabase auth, the route guard, and the email link handler
a825ec1  feat(db): seed the curriculum from the mock data
944b654  feat(db): row level security — the paywall
59b53fd  feat(db): add the core schema
14dad2e  chore: pin Node 22 and add the Supabase client packages
590bcbc  refactor: replace brand hexes with Tailwind theme tokens
87a6782  fix: denominate all prices in kobo
c00a821  feat: migrate from Vite to Next.js App Router
```

Remote is `git@github-akin202:Akin202/flag_sckool_app.git`. The aliased host is
deliberate — a bare `github.com` lets SSH pick a key nondeterministically across
this machine's four GitHub identities. Do not "simplify" it back.

---

## 2. Live infrastructure

Supabase project **`dgyfjwnyzxfvmhzkevaw`** ("Flag Skool App"), eu-west-1,
Postgres 17, `ACTIVE_HEALTHY`. The CLI is linked; `supabase/config.toml` and all
migrations are committed. `supabase/.temp/` is gitignored.

This project **will become production**. There is no separate staging project.
That is why `supabase db reset` is forbidden and why the test seeder refuses to
run without `ALLOW_TEST_SEED=1`.

All five migrations are applied:

| Migration | Contents |
|---|---|
| `20260825000001_schema.sql` | 11 tables |
| `20260825000002_rls.sql` | policies, definer helpers, column grants |
| `20260825000003_seed_curriculum.sql` | 1 org, 2 products, 6 modules, 15 lessons, 9 resources |
| `20260825000004_auth.sql` | `handle_new_user()` + trigger on `auth.users` |
| `20260825009999_pre_launch_cleanup.sql` | **inert by design** — body is commented out |

Seeded row counts were confirmed over PostgREST, not assumed.

The cleanup migration is a loaded gun left deliberately unloaded: it holds the
`delete from auth.users where email like '%@flagskool.test'` that must run
before launch. It was written while the context was fresh precisely because it
is the thing most likely to be forgotten.

---

## 3. The database

Eleven tables: `organizations`, `profiles`, `products`, `modules`, `lessons`,
`resources`, `discount_codes`, `transactions`, `enrollments`, `lesson_progress`,
`comments`. Plus a `curriculum` view and three functions.

Invariants that look redundant and are not:

- **`org_id` on every table.** One row today. It exists so multi-tenant is a
  weekend later rather than a rewrite. Do not remove it.
- **All money is `bigint`, named `*_kobo`.** No `numeric`, no `float`, ever.
  Format only through `koboToNaira`.
- **`UNIQUE (user_id, product_sku)` on `enrollments`** is the Paystack
  idempotency key. Paystack retries webhooks; without this constraint a retry
  double-enrolls. Stage 2 depends on it.
- **`order_index`, not `"order"`.** `order` is a SQL reserved word and collides
  with PostREST's `?order=` query parameter.
- **`lessons.duration_seconds`**, not minutes. `types/index.ts` wants
  `durationMinutes` — convert in `data-access.ts`.

### `types/index.ts` holds view models, not row shapes

This tension is resolved and should not be re-litigated. The schema must be able
to *produce* every UI type; the derivation lives in `lib/data-access.ts`:

| UI type | Database | Derivation |
|---|---|---|
| `Lesson.durationMinutes` | `duration_seconds` | convert |
| `Lesson.isFree` | `is_free_preview` | rename |
| `Module.number` | `order_index` | rename |
| `UserProfile.role` | `role` + `is_alumni` | `admin`→`instructor`, else `is_alumni`→`alumni`, else `student` |
| `UserProfile.tier` | *(no column)* | derive from `enrollments` |
| `LessonResource.sizeFormatted` / `downloadUrl` | `size_bytes` / `storage_path` | format + sign |
| `Enrollment.status` | `expires_at` | compare to `now()` |

`types/index.ts` was not modified in Stage 1 and should not be modified casually
— it is a contract.

`types/database.ts` is generated from the live schema and **committed**, so a
build never needs database credentials. Regenerate with `npm run db:types`
after every migration. A stale file is worse than no file: the compiler will
confidently agree with a schema that no longer exists.

---

## 4. The security model

**RLS is the paywall. `proxy.ts` is not.** The proxy only redirects logged-out
users for UX. Next.js has shipped middleware-bypass CVEs, and the Next 16 docs
themselves say not to rely on that layer for authorization. Every server
component additionally re-checks with `getUser()` — never `getSession()`, which
returns whatever is in the cookie without verifying it.

Three `SECURITY DEFINER` helpers, all with `SET search_path = public` (a definer
function without it is a privilege-escalation vector):

- `is_admin(uuid)`
- `user_has_sku(uuid, text)` — honours `products.grants_skus`, ignores expired
  enrollments. Cohort grants recordings through this.
- `validate_discount_code(text, text) → jsonb` — returns a computed preview and
  never exposes a row, with a generic failure message so codes cannot be
  enumerated.

They are definer-functions for a specific reason: a policy on `profiles` that
selects from `profiles` recurses infinitely. Definer functions break the cycle.

Deliberate states that look like omissions:

- **`discount_codes` has RLS enabled and zero policies**, plus `revoke all`.
  That denies everything to `anon`/`authenticated` while service role still
  passes. Validation goes only through the definer function.
- **`enrollments` has no INSERT policy for any client role.** Enrollment is
  created *only* by the verified Paystack webhook via service role. A browser
  redirect from Paystack grants nothing. A shortcut here costs ₦80,000 per head.
- **`profiles` has UPDATE revoked**, then re-granted on
  `(full_name, avatar_url, last_active_at)` only — so a student cannot promote
  themselves to admin.

### The acceptance gate — 14/14, 2026-08-25

`npm run rls:attack` creates two throwaway accounts via the service-role admin
API (`email_confirm: true`, so it is immune to SMTP rate limits), enrolls only
one, then attacks with the **anon key** straight against PostgREST — bypassing
every line of application code. It deletes the probes in a `finally` block and
exits non-zero on any failure.

```
ATTACKS  (must all return zero rows)
  PASS  unenrolled student reads paid lessons                      0 rows
  PASS  unenrolled student reads one paid lesson by id             0 rows
  PASS  unenrolled student reads paid resources                    0 rows
  PASS  any student reads discount_codes                           permission denied
  PASS  unenrolled student reads others' enrollments               0 rows
  PASS  unenrolled student reads others' transactions              0 rows
  PASS  student self-inserts an enrollment (the 150,000 naira attack)  permission denied
  PASS  student promotes self to admin                             role still 'student'
  PASS  ENROLLED student reads bunny_video_id directly             permission denied

CONTROLS  (must all return rows)
  PASS  unenrolled student reads the FREE preview lesson           1 row
  PASS  logged-out visitor reads the public curriculum view        15 rows
  PASS  logged-out visitor reads product pricing                   2 rows
  PASS  ENROLLED student reads the same paid lesson                1 row
  PASS  student reads their own profile                            1 row

14/14 passed
```

The controls matter as much as the attacks: a policy that denies everything
passes a deny-only test while breaking the product. **If you change any policy,
re-run this and keep it at 14/14.**

Client bundle was grepped after `npm run build`. The service-role key, the
literal string `service_role`, and the DB password are all absent from
`.next/static/`. The anon key *is* present in one chunk — that is the negative
control proving the grep was actually looking rather than silently finding
nothing.

---

## 5. Auth wiring

| File | Role |
|---|---|
| `lib/supabase/env.ts` | env accessors |
| `lib/supabase/client.ts` | browser client, anon key |
| `lib/supabase/server.ts` | RSC/route-handler client + `getCurrentUser()` |
| `lib/supabase/admin.ts` | **service role — bypasses RLS entirely** |
| `proxy.ts` | route guard (project root) |
| `app/auth/confirm/route.ts` | email link → `verifyOtp` |
| `app/auth/signout/route.ts` | POST-only, 303 |
| `src/components/auth/screens/AuthScreens.tsx` | real Supabase calls |

`admin.ts` opens with `import 'server-only'`, so importing it from anything that
reaches a client component is a **build error**, not a runtime leak. Do not
remove it, and do not re-export from it through a module a client component
touches. If you are reaching for the admin client to "make a query work", the
answer is almost always a missing RLS policy instead.

All three clients carry the `<Database>` generic.

`app/auth/confirm/route.ts` only accepts relative same-origin `next` paths —
that is an open-redirect guard, not incidental.

`app/login/page.tsx` is an async server component that reads `searchParams` and
passes `next` / `initialError` as props. It deliberately does **not** use
`useSearchParams()`, which forced a Suspense boundary and broke the build.

Verified live: logged-out `/dashboard`, `/learn`, `/admin` all return **307** to
`/login?next=…` with the return path preserved, while `/` and `/login` stay 200.

`handle_new_user()` mirrors `auth.users` into `profiles` on insert. Proven
working — the attack suite's "student reads their own profile" control returns a
row, which only happens if the trigger fired.

---

## 6. Gotchas that already cost real time

**Next 16 renamed `middleware.ts` → `proxy.ts`.** The exported function is
`proxy`, it defaults to the Node.js runtime, and setting `runtime` throws. Every
Supabase SSR tutorial online says `middleware.ts`; following one produces a file
Next silently ignores — an auth guard that never runs. Confirmed in
`node_modules/next/dist/docs/`. The build output printing `ƒ Proxy (Middleware)`
is how you know it is wired.

**`REVOKE SELECT (column)` is a silent no-op** while the role holds table-level
`SELECT`, which Supabase grants by default. Hiding `lessons.bunny_video_id`
required a table-level `REVOKE` followed by a column-level `GRANT` of everything
else. The first attempt looked correct and did nothing.

**Consequence: `select('*')` on `lessons` now errors for client roles.** Name
your columns. This also matters for tests — a star query would make the lesson
attacks "pass" because the star was rejected, not because the row policy denied
access, which is a far weaker guarantee than the test claims.

**Supabase's direct DB host is IPv6-only and this machine has no IPv6 route.**
`db.dgyfjwnyzxfvmhzkevaw.supabase.co` has no A record; `curl -6` returns 000.
The CLI resolves this itself by using the pooler. If it ever does not, the
fallback is — note **port 5432 (session mode)**, not 6543, because transaction
mode breaks the DDL migrations run in:

```bash
supabase db push --db-url \
  "postgresql://postgres.dgyfjwnyzxfvmhzkevaw:<url-encoded-password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

**Scripts require Node 22.** On Node 20 they fail with `node: bad option:
--experimental-strip-types`, which does not obviously point at the Node version.
`.nvmrc` pins 22 and `nvm alias default 22` is set, but a stale shell can still
be on 20. Check `node -v` first.

**Local dev is on port 3001.** 3000 is occupied by another project's dev server.
`NEXT_PUBLIC_SITE_URL` is set accordingly in `.env.local`, and Supabase's
redirect URLs must match.

**Docker is not used anywhere.** No local Supabase stack. `gen types --local`
and `db reset` both assume it and will fail or do damage.

---

## 7. Deliberately not done

- **`lib/data-access.ts` still returns mocks** — all 29 functions import from
  `lib/mock-data.ts`. This is the seam between UI and database. Replace the
  bodies in Stage 2/3; **never change the signatures**.
- **`lib/mock-data.ts` stays** until the end of Stage 3.
- **Google OAuth deferred to Stage 2.** The button renders disabled with a
  "coming soon" tooltip. `google: false` confirmed in the live auth settings.
- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (`sb_publishable_…`) sits unused in
  `.env.local` as the future migration path. We use the legacy anon key, to pair
  with the legacy-format service-role key. Do not mix formats.

---

## 8. Open items

**Supabase dashboard — Auth → URL Configuration.** Site URL and redirect URLs
must use **`http://localhost:3001`** (not 3000 — the port changed after that
instruction was first given) plus `https://flagskool.com/**`.

**Supabase dashboard — Auth → SMTP.** Blocked. Resend has **no domains added**
(checked via its API), and Supabase will not send from an unverified domain.
`flagskool.com` needs adding to Resend and its DNS records verifying first.
`RESEND_FROM_EMAIL` is empty in `.env.local` and needs that address. Until then
the default Supabase mailer applies at ~2 emails/hour — enough for one clean
signup test, not for retries. `mailer_autoconfirm: false` is confirmed on the
live project, so email confirmation is genuinely required.

**On-device test not yet run:** phone → signup → verify email → login →
`/dashboard` → seeded curriculum with paid lessons locked. This is the last
open Stage 1 gate.

**Missing helpers.** The build kit says to import `applyDiscount` and
`computeModuleProgress` from `types/index.ts` rather than reimplementing them.
**Neither exists.** They need writing when Stage 2/3 arrives.

**Untracked by choice:** `flag-skool-build-kit.md` (pricing strategy and
commercial notes) and `graphify-out/`.

**28 `TODO(handoff)` markers** remain across 19 files — mostly in `src/views/`
and `src/components/`, marking where real logic belongs. `grep -rn "TODO(handoff)"`.

---

## 9. Re-verify rather than trust

Nothing here needs to be taken on faith:

```bash
nvm use                      # Node 22
supabase projects list       # confirm the CLI sees dgyfjwnyzxfvmhzkevaw
supabase migration list      # confirm all five applied remotely

npm run lint                 # tsc --noEmit → 0 errors
npm run build                # → 22 routes, prints "ƒ Proxy (Middleware)"
npm run rls:attack           # → must be 14/14

# service-role key must not reach the browser bundle;
# the anon key SHOULD match, which proves the grep works
grep -rl "$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)" .next/static/
grep -rl "$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)" .next/static/
```
