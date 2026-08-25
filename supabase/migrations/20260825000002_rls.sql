-- =============================================================================
-- Flag Skool — Row Level Security. This is the paywall.
--
-- Application-level access checks are NOT sufficient. The test that matters:
-- a paying student's own session key, pasted into the browser console, must
-- not be able to read a lesson they did not pay for. scripts/rls-attack.ts
-- proves it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions.
--
-- These are SECURITY DEFINER for a specific reason, not for convenience: a
-- policy on profiles that itself selects from profiles recurses infinitely,
-- and so does a policy on enrollments that reads enrollments. A definer
-- function bypasses RLS and breaks the cycle.
--
-- SET search_path is mandatory. A SECURITY DEFINER function without it lets a
-- caller shadow the tables it references and run code as the owner.
-- -----------------------------------------------------------------------------

create or replace function public.is_admin(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user and role = 'admin'
  );
$$;

-- True when p_user holds an enrollment that grants p_sku, either directly or
-- through products.grants_skus (a cohort enrollment grants the recordings).
create or replace function public.user_has_sku(p_user uuid, p_sku text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.products p
      on p.org_id = e.org_id
     and p.sku    = e.product_sku
    where e.user_id = p_user
      and (e.expires_at is null or e.expires_at > now())
      and (e.product_sku = p_sku or p_sku = any (p.grants_skus))
  );
$$;

revoke all on function public.is_admin(uuid)          from public, anon;
revoke all on function public.user_has_sku(uuid,text) from public, anon;
grant execute on function public.is_admin(uuid)          to authenticated;
grant execute on function public.user_has_sku(uuid,text) to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere. No exceptions.
-- -----------------------------------------------------------------------------
alter table public.organizations   enable row level security;
alter table public.profiles        enable row level security;
alter table public.products        enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.resources       enable row level security;
alter table public.discount_codes  enable row level security;
alter table public.transactions    enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.comments        enable row level security;

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
create policy organizations_read_own on public.organizations
  for select to authenticated
  using (id in (select org_id from public.profiles where id = (select auth.uid())));

-- -----------------------------------------------------------------------------
-- profiles
--
-- The update policy alone is not enough: without column grants a student can
-- UPDATE their own row and set role = 'admin'. Postgres column privileges are
-- the fix; RLS has no column-level equivalent.
-- -----------------------------------------------------------------------------
create policy profiles_read_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin((select auth.uid())));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, last_active_at) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- products / modules — public marketing data. Prices and the module list are
-- both rendered on the landing page to logged-out visitors.
-- -----------------------------------------------------------------------------
create policy products_read_all on public.products
  for select to anon, authenticated using (true);

create policy modules_read_all on public.modules
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.products, public.modules from anon, authenticated;

-- -----------------------------------------------------------------------------
-- lessons — the actual gate
--
-- Readable when the lesson is a published free preview, OR the user holds an
-- enrollment granting the parent module's product sku.
--
-- Separately, bunny_video_id is revoked from every client role. Even an
-- entitled student must not be able to read the raw video id: playback URLs
-- are signed server-side with a short TTL after an enrollment check, and the
-- Bunny token key never reaches the browser. Column privileges, not RLS, are
-- what enforce this — RLS is row-level only.
-- -----------------------------------------------------------------------------
create policy lessons_read_entitled on public.lessons
  for select to anon, authenticated
  using (
    published_at is not null
    and (
      is_free_preview
      or public.user_has_sku(
           (select auth.uid()),
           (select m.product_sku from public.modules m where m.id = lessons.module_id)
         )
    )
  );

revoke insert, update, delete on public.lessons from anon, authenticated;

-- Hiding bunny_video_id takes a table-level REVOKE followed by a column-level
-- GRANT of everything else. A bare `REVOKE SELECT (bunny_video_id)` is a
-- silent no-op while the role still holds table-level SELECT, which Supabase
-- grants by default — the column would stay readable and the revoke would
-- look like it had worked.
--
-- Consequence for callers: `select *` on lessons now fails for client roles.
-- Name the columns. Server-side code that needs the video id uses the service
-- role client, which is unaffected.
revoke select on public.lessons from anon, authenticated;
grant select (
  id, org_id, module_id, order_index, title, description,
  duration_seconds, is_free_preview, published_at, created_at
) on public.lessons to anon, authenticated;

-- -----------------------------------------------------------------------------
-- curriculum view — controlled public disclosure
--
-- The landing page lists every module and lesson title, including paid ones,
-- as marketing. That is intentional: titles sell the course, videos are what
-- is paid for. This view is deliberately NOT security_invoker, so it bypasses
-- the lessons policy above and exposes exactly the safe columns and nothing
-- else. bunny_video_id is absent by construction.
-- -----------------------------------------------------------------------------
create view public.curriculum
with (security_invoker = false) as
  select
    m.id            as module_id,
    m.org_id,
    m.product_sku,
    m.order_index   as module_order,
    m.title         as module_title,
    m.description   as module_description,
    l.id            as lesson_id,
    l.order_index   as lesson_order,
    l.title         as lesson_title,
    l.description   as lesson_description,
    l.duration_seconds,
    l.is_free_preview,
    l.published_at
  from public.modules m
  join public.lessons l on l.module_id = m.id
  where l.published_at is not null;

grant select on public.curriculum to anon, authenticated;

-- -----------------------------------------------------------------------------
-- resources — inherit the parent lesson/module entitlement
-- -----------------------------------------------------------------------------
create policy resources_read_entitled on public.resources
  for select to authenticated
  using (
    public.user_has_sku(
      (select auth.uid()),
      (select m.product_sku from public.modules m where m.id = resources.module_id)
    )
    or exists (
      select 1 from public.lessons l
      where l.id = resources.lesson_id
        and l.is_free_preview
        and l.published_at is not null
    )
  );

revoke insert, update, delete on public.resources from anon, authenticated;

-- -----------------------------------------------------------------------------
-- discount_codes — NO client access whatsoever.
--
-- RLS is enabled and deliberately has zero policies, which denies every row to
-- anon and authenticated while the service role still passes. The explicit
-- REVOKE below is defence in depth: if someone later adds a permissive policy
-- by mistake, the missing table grant still blocks reads.
--
-- Validation goes exclusively through validate_discount_code(), which returns
-- a computed preview and never a row.
-- -----------------------------------------------------------------------------
revoke all on public.discount_codes from anon, authenticated;

create or replace function public.validate_discount_code(p_code text, p_sku text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code    public.discount_codes%rowtype;
  v_price   bigint;
  v_percent int    := 0;
  v_amount  bigint := 0;
  v_final   bigint;
  v_user    uuid   := auth.uid();
  v_email   text;
begin
  if v_user is null then
    return jsonb_build_object('valid', false, 'error', 'You must be signed in to use a code.');
  end if;

  select price_kobo into v_price from public.products where sku = p_sku and is_active;
  if v_price is null then
    return jsonb_build_object('valid', false, 'error', 'Unknown product.');
  end if;

  select * into v_code
  from public.discount_codes
  where upper(code) = upper(trim(p_code))
    and is_active
    and (starts_at  is null or starts_at  <= now())
    and (expires_at is null or expires_at >  now())
    and (applies_to_sku = 'all' or applies_to_sku = p_sku)
  limit 1;

  -- One generic message for missing/expired/wrong-product, so the response
  -- cannot be used to enumerate which codes exist.
  if v_code.id is null then
    return jsonb_build_object('valid', false, 'error', 'That code is not valid for this purchase.');
  end if;

  if v_code.max_redemptions is not null and v_code.redemption_count >= v_code.max_redemptions then
    return jsonb_build_object('valid', false, 'error', 'That code has already been fully redeemed.');
  end if;

  if v_code.restricted_to_email is not null then
    select email into v_email from public.profiles where id = v_user;
    if lower(v_email) is distinct from lower(v_code.restricted_to_email) then
      return jsonb_build_object('valid', false, 'error', 'That code is not valid for this account.');
    end if;
  end if;

  if v_code.value ? 'percent' then
    v_percent := (v_code.value ->> 'percent')::int;
    v_amount  := (v_price * v_percent) / 100;
  elsif v_code.value ? 'kobo' then
    v_amount  := least((v_code.value ->> 'kobo')::bigint, v_price);
    v_percent := case when v_price > 0 then ((v_amount * 100) / v_price)::int else 0 end;
  end if;

  v_final := greatest(v_price - v_amount, 0);

  return jsonb_build_object(
    'valid', true,
    'code',                upper(trim(p_code)),
    'discountPercent',     v_percent,
    'discountAmountKobo',  v_amount,
    'originalPriceKobo',   v_price,
    'finalPriceKobo',      v_final,
    'isFullyDiscounted',   v_final = 0
  );
end;
$$;

revoke all on function public.validate_discount_code(text, text) from public, anon;
grant execute on function public.validate_discount_code(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- transactions — read own, never write
-- -----------------------------------------------------------------------------
create policy transactions_read_own on public.transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

revoke insert, update, delete on public.transactions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- enrollments — read own; INSERT denied to every client role.
--
-- Enrollment is created ONLY by the verified Paystack webhook running under
-- the service role. The browser redirect back from Paystack grants nothing:
-- anyone can visit a redirect URL, and a shortcut here costs 80,000 naira per
-- head. There is deliberately no insert/update/delete policy below.
-- -----------------------------------------------------------------------------
create policy enrollments_read_own on public.enrollments
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

revoke insert, update, delete on public.enrollments from anon, authenticated;

-- -----------------------------------------------------------------------------
-- lesson_progress — read and write own rows only
-- -----------------------------------------------------------------------------
create policy lesson_progress_read_own on public.lesson_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

create policy lesson_progress_insert_own on public.lesson_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy lesson_progress_update_own on public.lesson_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke delete on public.lesson_progress from anon, authenticated;

-- -----------------------------------------------------------------------------
-- comments — enrolled users only; author writes own; admins pin and delete
-- -----------------------------------------------------------------------------
create policy comments_read_enrolled on public.comments
  for select to authenticated
  using (
    public.user_has_sku(
      (select auth.uid()),
      (select m.product_sku
         from public.lessons l
         join public.modules m on m.id = l.module_id
        where l.id = comments.lesson_id)
    )
    or public.is_admin((select auth.uid()))
  );

create policy comments_insert_enrolled on public.comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.user_has_sku(
      (select auth.uid()),
      (select m.product_sku
         from public.lessons l
         join public.modules m on m.id = l.module_id
        where l.id = comments.lesson_id)
    )
  );

-- Pinning and deletion are admin-only, per spec. A student cannot delete their
-- own comment; that is deliberate, not an oversight.
create policy comments_update_admin on public.comments
  for update to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

create policy comments_delete_admin on public.comments
  for delete to authenticated
  using (public.is_admin((select auth.uid())));
