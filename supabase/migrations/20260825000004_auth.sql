-- =============================================================================
-- Flag Skool — auth wiring
--
-- Runs AFTER the curriculum seed, because the trigger below needs the
-- organization row to exist before the first signup.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Mirror every auth.users row into public.profiles.
--
-- SECURITY DEFINER because profiles has INSERT revoked from every client role
-- — the trigger owner is what makes this write legal.
--
-- Anything raised in here surfaces to the user as a failed signup, so it stays
-- deliberately small. full_name comes from the signup form's metadata; Google
-- OAuth (Stage 2) sends 'name' and 'avatar_url' instead, which is why both
-- keys are read.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where slug = 'flag-skool';

  if v_org is null then
    raise exception
      'handle_new_user: no organization with slug ''flag-skool''. Apply the curriculum seed migration before allowing signups.';
  end if;

  insert into public.profiles (id, org_id, email, full_name, avatar_url)
  values (
    new.id,
    v_org,
    new.email,
    nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Backfill: any user created before this migration (there should be none on a
-- fresh project, but this makes the migration safe to apply to a project that
-- already has signups).
-- -----------------------------------------------------------------------------
insert into public.profiles (id, org_id, email, full_name, avatar_url)
select
  u.id,
  o.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ''),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
cross join (select id from public.organizations where slug = 'flag-skool') o
on conflict (id) do nothing;
