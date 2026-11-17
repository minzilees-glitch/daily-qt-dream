-- Reset personal Kakao nickname on seed demo profile u-001.
-- Live DB had display_name = 「밍밍이」 (Minzi's nick) on the prototype seed row.
-- Seed / roster identity must stay legal name 「이민지」 (not a personal nickname).
-- Paste into Supabase SQL Editor if u-001 still shows 밍밍이 in Dashboard.

update public.profiles
set
  display_name = '이민지',
  updated_at = now()
where id = 'u-001'
  and display_name is distinct from '이민지';

-- Safety: any other seed-id row that somehow got this nick.
update public.profiles
set
  display_name = '이민지',
  updated_at = now()
where id like 'u-%'
  and display_name = '밍밍이';
