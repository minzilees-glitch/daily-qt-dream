-- 드림 매일큐티 — Kakao OAuth + community verification columns (DQ-17)
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Do NOT apply 20261118_rls_security_harden.sql until Kakao login works (DQ-699).
--
-- profiles.id becomes auth.uid()::text for new Kakao users.
-- Seed rows (u-001…) may remain for demo QT until roster rematch.

alter table public.profiles
  add column if not exists legal_name text;

alter table public.profiles
  add column if not exists community_status text
    check (
      community_status is null
      or community_status in ('pending', 'verified', 'exception')
    );

comment on column public.profiles.legal_name is
  '본명 from 다락방→순→roster match (not Kakao nickname)';
comment on column public.profiles.community_status is
  'pending | verified | exception (manual admin path)';

-- Existing seed members with a group are treated as already verified.
update public.profiles
set community_status = 'verified'
where group_id is not null
  and (community_status is null or community_status = 'pending');

update public.profiles
set community_status = 'pending'
where community_status is null;

-- Allow Kakao users to create their own profile row (phase bridge; tighten in DQ-699).
drop policy if exists "profiles_insert_anon" on public.profiles;
create policy "profiles_insert_anon"
  on public.profiles for insert
  to anon, authenticated
  with check (true);

grant insert on public.profiles to anon, authenticated;
