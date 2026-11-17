-- Claimed 본명 helpers for /verify (RLS-safe).
-- Pending users cannot SELECT other profiles' legal_name under harden RLS,
-- so expose only the verified-name set via SECURITY DEFINER RPCs.
-- Paste into Supabase SQL Editor after 20261117_kakao_community_verify.sql.

create or replace function public.claimed_legal_names()
returns table (legal_name text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct trim(both from p.legal_name) as legal_name
  from public.profiles p
  where p.community_status = 'verified'
    and p.legal_name is not null
    and length(trim(both from p.legal_name)) > 0
    and p.id is distinct from auth.uid()::text;
$$;

create or replace function public.is_legal_name_taken(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.community_status = 'verified'
      and p.legal_name is not null
      and trim(both from p.legal_name) = trim(both from candidate)
      and p.id is distinct from auth.uid()::text
  );
$$;

revoke all on function public.claimed_legal_names() from public;
revoke all on function public.is_legal_name_taken(text) from public;
grant execute on function public.claimed_legal_names() to authenticated;
grant execute on function public.is_legal_name_taken(text) to authenticated;
