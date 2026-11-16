-- 드림 매일큐티 — RLS + Storage hardening (profiles / groups / qt_entries / avatars)
-- Apply in Supabase Dashboard → SQL Editor → Run
-- (after 20261103_* + 20261104_* + 20261117_sun_roster_seed.sql).
--
-- Target model (Kakao / auth.uid()):
--   profiles.id = auth.uid()::text
--   Client: NEXT_PUBLIC_SUPABASE_ANON_KEY + user JWT
--   Server / seed / admin roster: service_role only (bypasses RLS; never ship to client)
--
-- IMPORTANT — pre-Kakao prototype:
--   The app currently uses anon without a JWT (localStorage session ids).
--   Applying this migration DROPS the open phase-bridge policies and will block
--   browser CRUD until Kakao (or another auth) maps JWT → profiles.id.
--   Keep service_role for Dashboard SQL / roster seed. Do NOT put phone numbers
--   in client-readable tables (Kakao match later).
--
-- Product reads:
--   우리순 / ranking need star·completion presence, NOT other members' journal text.
--   Use public.get_qt_presence() (SECURITY DEFINER) for cross-user lights.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER; fixed search_path)
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns text
language sql
stable
as $$
  select auth.uid()::text;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()::text
      and p.role = 'admin'
  );
$$;

create or replace function public.my_group_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.group_id
  from public.profiles p
  where p.id = auth.uid()::text;
$$;

create or replace function public.profiles_share_group(target_user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles them on them.id = target_user_id
    where me.id = auth.uid()::text
      and me.group_id is not null
      and me.group_id = them.group_id
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.my_group_id() from public;
revoke all on function public.profiles_share_group(text) from public;
grant execute on function public.current_profile_id() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_group_id() to authenticated;
grant execute on function public.profiles_share_group(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Protect privileged profile columns (role / group_id) on UPDATE
-- Non-admins may only change display_name / avatar_url / updated_at (etc.).
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_privileged_cols()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role can only be changed by admin or service_role';
  end if;

  if new.group_id is distinct from old.group_id then
    raise exception 'profiles.group_id can only be changed by admin or service_role';
  end if;

  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged_cols on public.profiles;
create trigger trg_protect_profile_privileged_cols
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_cols();

-- ---------------------------------------------------------------------------
-- Presence RPC — star / completion only (no meditation/verse/prayer/decision)
-- ---------------------------------------------------------------------------

create or replace function public.get_qt_presence()
returns table (user_id text, entry_date date)
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id, e.entry_date
  from public.qt_entries e
  join public.profiles owner on owner.id = e.user_id
  where auth.uid() is not null
    and (
      public.is_admin()
      or e.user_id = auth.uid()::text
      or (
        owner.group_id is not null
        and owner.group_id = public.my_group_id()
      )
    );
$$;

revoke all on function public.get_qt_presence() from public;
grant execute on function public.get_qt_presence() to authenticated;

-- Optional: group star counts (date range) without exposing journal text
create or replace function public.get_group_qt_counts(
  p_group_id text,
  p_from date default null,
  p_to date default null
)
returns table (user_id text, entry_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id, count(*)::bigint as entry_count
  from public.qt_entries e
  join public.profiles owner on owner.id = e.user_id
  where auth.uid() is not null
    and owner.group_id = p_group_id
    and (
      public.is_admin()
      or public.my_group_id() = p_group_id
    )
    and (p_from is null or e.entry_date >= p_from)
    and (p_to is null or e.entry_date <= p_to)
  group by e.user_id;
$$;

revoke all on function public.get_group_qt_counts(text, date, date) from public;
grant execute on function public.get_group_qt_counts(text, date, date) to authenticated;

-- Keep presence view, but it inherits qt_entries RLS (own rows only for clients).
create or replace view public.qt_entry_presence
with (security_invoker = true)
as
select user_id, entry_date, updated_at
from public.qt_entries;

-- ---------------------------------------------------------------------------
-- Enable RLS (idempotent)
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.qt_entries enable row level security;
alter table public.reading_ranges enable row level security;

-- ---------------------------------------------------------------------------
-- Drop phase-bridge open policies
-- ---------------------------------------------------------------------------

drop policy if exists "groups_select_anon" on public.groups;
drop policy if exists "profiles_select_anon" on public.profiles;
drop policy if exists "profiles_update_anon" on public.profiles;
drop policy if exists "qt_entries_select_anon" on public.qt_entries;
drop policy if exists "qt_entries_insert_anon" on public.qt_entries;
drop policy if exists "qt_entries_update_anon" on public.qt_entries;
drop policy if exists "qt_entries_delete_anon" on public.qt_entries;
drop policy if exists "reading_ranges_select_anon" on public.reading_ranges;

drop policy if exists "groups_select_authenticated" on public.groups;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_same_group" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "qt_entries_select_own" on public.qt_entries;
drop policy if exists "qt_entries_insert_own" on public.qt_entries;
drop policy if exists "qt_entries_update_own" on public.qt_entries;
drop policy if exists "qt_entries_delete_own" on public.qt_entries;
drop policy if exists "reading_ranges_select_authenticated" on public.reading_ranges;

-- ---------------------------------------------------------------------------
-- groups: authenticated SELECT; mutations via service_role / admin SQL only
-- ---------------------------------------------------------------------------

create policy "groups_select_authenticated"
  on public.groups for select
  to authenticated
  using (true);

-- No insert/update/delete policies for anon/authenticated → service_role only.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid()::text);

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- 우리순 / ranking / avatar map for same 순
create policy "profiles_select_same_group"
  on public.profiles for select
  to authenticated
  using (
    group_id is not null
    and group_id = public.my_group_id()
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No client insert/delete — roster seed + Kakao match use service_role.

-- ---------------------------------------------------------------------------
-- qt_entries: owner CRUD only (journal text private)
-- Cross-user lights → get_qt_presence() / get_group_qt_counts()
-- ---------------------------------------------------------------------------

create policy "qt_entries_select_own"
  on public.qt_entries for select
  to authenticated
  using (user_id = auth.uid()::text);

create policy "qt_entries_insert_own"
  on public.qt_entries for insert
  to authenticated
  with check (user_id = auth.uid()::text);

create policy "qt_entries_update_own"
  on public.qt_entries for update
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy "qt_entries_delete_own"
  on public.qt_entries for delete
  to authenticated
  using (user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- reading_ranges: public reading plan (no PII)
-- ---------------------------------------------------------------------------

create policy "reading_ranges_select_authenticated"
  on public.reading_ranges for select
  to authenticated
  using (true);

-- Allow anon read of reading plan only (still no QT / profiles writes)
create policy "reading_ranges_select_anon"
  on public.reading_ranges for select
  to anon
  using (true);

-- ---------------------------------------------------------------------------
-- Grants (narrow). service_role bypasses RLS automatically.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

revoke all on public.groups from anon;
revoke all on public.profiles from anon;
revoke all on public.qt_entries from anon;

grant select on public.groups to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.qt_entries to authenticated;
grant select on public.reading_ranges to anon, authenticated;
grant select on public.qt_entry_presence to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: avatars — public read; write only under {auth.uid()}/*
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_anon" on storage.objects;
drop policy if exists "avatars_update_anon" on storage.objects;
drop policy if exists "avatars_delete_anon" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
