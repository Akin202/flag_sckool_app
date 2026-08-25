-- =============================================================================
-- Flag Skool — core schema
--
-- Shape rules that are load-bearing, not stylistic:
--   * Every table carries org_id. There is exactly one organization row today.
--     It exists so multi-tenant is a weekend later rather than a rewrite.
--   * All money is bigint kobo, named *_kobo. Never numeric, never float.
--   * Products are addressed by (org_id, sku), not by uuid, because the
--     Paystack webhook and the discount engine both speak in skus.
--
-- Column naming note: the build kit spec calls the ordering column "order".
-- It is a SQL reserved word AND a PostgREST query parameter, so it is
-- order_index here. Nothing else deviates.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- profiles — mirrors auth.users, created by trigger (see the auth migration)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  org_id         uuid not null references public.organizations (id) on delete restrict,
  email          text not null,
  full_name      text,
  avatar_url     text,
  role           text not null default 'student' check (role in ('student', 'admin')),
  is_alumni      boolean not null default false,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz
);

create index profiles_org_id_idx on public.profiles (org_id);

-- -----------------------------------------------------------------------------
-- products — 'recordings' and 'cohort'
--
-- grants_skus is what makes a cohort purchase also unlock the recordings.
-- The RLS helper user_has_sku() reads it; do not collapse it into a boolean.
-- -----------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  sku         text not null,
  title       text not null,
  subtitle    text,
  price_kobo  bigint not null check (price_kobo >= 0),
  is_active   boolean not null default true,
  grants_skus text[] not null default '{}',
  created_at  timestamptz not null default now(),
  unique (org_id, sku)
);

create index products_org_id_idx on public.products (org_id);

-- -----------------------------------------------------------------------------
-- modules
-- -----------------------------------------------------------------------------
create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  product_sku text not null,
  order_index int not null,
  title       text not null,
  description text,
  created_at  timestamptz not null default now(),
  foreign key (org_id, product_sku) references public.products (org_id, sku) on delete cascade,
  unique (org_id, order_index)
);

create index modules_org_id_idx on public.modules (org_id);
create index modules_product_idx on public.modules (org_id, product_sku);

-- -----------------------------------------------------------------------------
-- lessons
--
-- duration_seconds, not minutes — the resume engine works in seconds and
-- rounding at the storage layer would make positions drift.
-- published_at null means draft: invisible to students regardless of tier.
-- -----------------------------------------------------------------------------
create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  module_id        uuid not null references public.modules (id) on delete cascade,
  order_index      int not null,
  title            text not null,
  description      text,
  bunny_video_id   text,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  is_free_preview  boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (module_id, order_index)
);

create index lessons_org_id_idx    on public.lessons (org_id);
create index lessons_module_id_idx on public.lessons (module_id);

-- -----------------------------------------------------------------------------
-- resources — downloadable material, attached to a module and optionally a lesson
--
-- file_format is stored rather than derived from storage_path: the UI shows it
-- as a badge ('JSON', 'ZIP', 'IPYNB') and external_url rows have no path to
-- derive from.
-- -----------------------------------------------------------------------------
create table public.resources (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  module_id    uuid not null references public.modules (id) on delete cascade,
  lesson_id    uuid references public.lessons (id) on delete set null,
  title        text not null,
  description  text,
  kind         text not null check (kind in ('blueprint', 'code', 'slide', 'dataset', 'doc')),
  file_format  text not null,
  storage_path text,
  size_bytes   bigint not null default 0 check (size_bytes >= 0),
  external_url text,
  created_at   timestamptz not null default now(),
  -- a resource is either in our storage bucket or off-site, but must be one
  check (storage_path is not null or external_url is not null)
);

create index resources_org_id_idx    on public.resources (org_id);
create index resources_module_id_idx on public.resources (module_id);
create index resources_lesson_id_idx on public.resources (lesson_id);

-- -----------------------------------------------------------------------------
-- discount_codes
--
-- value is jsonb so a code can be either {"percent": 50} or {"kobo": 2500000}
-- without two nullable columns that can both be set.
-- NOTE: no client role ever reads this table. See the RLS migration.
-- -----------------------------------------------------------------------------
create table public.discount_codes (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  code               text not null,
  kind               text not null check (kind in ('invite', 'promo', 'alumni')),
  value              jsonb not null,
  applies_to_sku     text not null default 'all' check (applies_to_sku in ('all', 'cohort', 'recordings')),
  max_redemptions    int check (max_redemptions is null or max_redemptions > 0),
  redemption_count   int not null default 0 check (redemption_count >= 0),
  restricted_to_email text,
  owner_user_id      uuid references public.profiles (id) on delete set null,
  starts_at          timestamptz,
  expires_at         timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (org_id, code)
);

create index discount_codes_org_code_idx on public.discount_codes (org_id, code);
create index discount_codes_owner_idx    on public.discount_codes (owner_user_id);

-- -----------------------------------------------------------------------------
-- transactions — the Paystack ledger
--
-- reference is globally unique: it is the webhook's idempotency handle.
-- -----------------------------------------------------------------------------
create table public.transactions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  product_sku      text not null,
  reference        text not null unique,
  amount_kobo      bigint not null check (amount_kobo >= 0),
  discount_code_id uuid references public.discount_codes (id) on delete set null,
  status           text not null default 'pending' check (status in ('paid', 'pending', 'refunded', 'failed')),
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  foreign key (org_id, product_sku) references public.products (org_id, sku) on delete restrict
);

create index transactions_org_id_idx   on public.transactions (org_id);
create index transactions_user_id_idx  on public.transactions (user_id);
create index transactions_discount_idx on public.transactions (discount_code_id);

-- -----------------------------------------------------------------------------
-- enrollments — the paywall's source of truth
--
-- UNIQUE (user_id, product_sku) is what makes the Paystack webhook idempotent.
-- Paystack retries deliveries; without this constraint a retry enrolls twice.
-- Do not remove it to "allow re-purchase".
-- -----------------------------------------------------------------------------
create table public.enrollments (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  product_sku      text not null,
  source           text not null default 'purchase' check (source in ('purchase', 'invite', 'comp')),
  transaction_id   uuid references public.transactions (id) on delete set null,
  discount_code_id uuid references public.discount_codes (id) on delete set null,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz,
  unique (user_id, product_sku),
  foreign key (org_id, product_sku) references public.products (org_id, sku) on delete restrict
);

create index enrollments_org_id_idx       on public.enrollments (org_id);
create index enrollments_user_sku_idx     on public.enrollments (user_id, product_sku);
create index enrollments_transaction_idx  on public.enrollments (transaction_id);
create index enrollments_discount_idx     on public.enrollments (discount_code_id);

-- -----------------------------------------------------------------------------
-- lesson_progress — the resume engine
--
-- UNIQUE (user_id, lesson_id) is the upsert target the player writes against
-- every config.player.savePositionEverySeconds.
-- -----------------------------------------------------------------------------
create table public.lesson_progress (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  lesson_id        uuid not null references public.lessons (id) on delete cascade,
  position_seconds int not null default 0 check (position_seconds >= 0),
  completed_at     timestamptz,
  last_watched_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index lesson_progress_org_id_idx    on public.lesson_progress (org_id);
create index lesson_progress_user_less_idx on public.lesson_progress (user_id, lesson_id);
create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now()
);

create index comments_org_id_idx    on public.comments (org_id);
create index comments_lesson_id_idx on public.comments (lesson_id);
create index comments_user_id_idx   on public.comments (user_id);
