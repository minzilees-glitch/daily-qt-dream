-- 드림 매일큐티 — QT storage schema (Phase bridge, NO Kakao auth yet)
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- IDs are TEXT to match the prototype local session user ids (e.g. u-001, g-01).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id text primary key,
  name text not null,
  leader_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  display_name text not null,
  group_id text references public.groups (id) on delete set null,
  role text not null default 'member'
    check (role in ('admin', 'member', 'leader')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qt_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  entry_date date not null,
  meditation text not null default '',
  verse text not null default '',
  prayer text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists qt_entries_user_date_idx
  on public.qt_entries (user_id, entry_date desc);

create index if not exists qt_entries_date_idx
  on public.qt_entries (entry_date);

create table if not exists public.reading_ranges (
  entry_date date primary key,
  reference text not null,
  title text,
  body text,
  created_at timestamptz not null default now()
);

-- Presence only (no meditation/verse/prayer) for light counts / group charts.
create or replace view public.qt_entry_presence
with (security_invoker = true)
as
select user_id, entry_date, updated_at
from public.qt_entries;

-- ---------------------------------------------------------------------------
-- Seed: 사랑순 + test profile matching app TEST_USER_ID = u-001
-- ---------------------------------------------------------------------------

insert into public.groups (id, name, leader_id)
values ('g-01', '사랑순', 'u-001')
on conflict (id) do update
  set name = excluded.name,
      leader_id = excluded.leader_id;

insert into public.profiles (id, display_name, group_id, role)
values ('u-001', '테스트유저', 'g-01', 'admin')
on conflict (id) do update
  set display_name = excluded.display_name,
      group_id = excluded.group_id,
      role = excluded.role,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- TEMPORARY Phase bridge (no Kakao / no auth.uid()):
-- The app keeps mock test login in localStorage and writes qt_entries with
-- that local user_id. Until real auth lands, policies must allow the anon
-- key to reach these tables. Tighten to auth.uid()::text = user_id later.
--
-- Intent:
-- - QT text (meditation/verse/prayer) is only for the owning user in the UI.
-- - Group light counts use qt_entry_presence (date + user_id only).
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.qt_entries enable row level security;
alter table public.reading_ranges enable row level security;

-- Drop old policies if re-running
drop policy if exists "groups_select_anon" on public.groups;
drop policy if exists "profiles_select_anon" on public.profiles;
drop policy if exists "qt_entries_select_anon" on public.qt_entries;
drop policy if exists "qt_entries_insert_anon" on public.qt_entries;
drop policy if exists "qt_entries_update_anon" on public.qt_entries;
drop policy if exists "qt_entries_delete_anon" on public.qt_entries;
drop policy if exists "reading_ranges_select_anon" on public.reading_ranges;

-- Groups / profiles readable (needed for group membership + light aggregation)
create policy "groups_select_anon"
  on public.groups for select
  to anon, authenticated
  using (true);

create policy "profiles_select_anon"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- QT entries: full row access via anon (Phase bridge — client scopes by session)
-- UI never shows another member's meditation/verse/prayer; prefer presence view
-- for cross-user light counts. Replace with auth.uid() checks after Kakao.
create policy "qt_entries_select_anon"
  on public.qt_entries for select
  to anon, authenticated
  using (true);

create policy "qt_entries_insert_anon"
  on public.qt_entries for insert
  to anon, authenticated
  with check (true);

create policy "qt_entries_update_anon"
  on public.qt_entries for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "qt_entries_delete_anon"
  on public.qt_entries for delete
  to anon, authenticated
  using (true);

create policy "reading_ranges_select_anon"
  on public.reading_ranges for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.groups to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.qt_entries to anon, authenticated;
grant select on public.reading_ranges to anon, authenticated;
grant select on public.qt_entry_presence to anon, authenticated;
