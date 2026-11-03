-- 드림 매일큐티 — Profile avatars (Storage + profiles.avatar_url)
-- Paste into Supabase Dashboard → SQL Editor → Run
--   (or apply after 20261103_qt_storage.sql).
--
-- Bucket: public.avatars (public read)
-- Object path: {userId}/avatar.{jpg|png|webp|gif}
-- Public URL: {SUPABASE_URL}/storage/v1/object/public/avatars/{userId}/avatar.{ext}
--
-- Phase bridge (no Kakao / no auth.uid() yet): anon can read + write the
-- avatars bucket and update profiles.avatar_url. Tighten to
--   auth.uid()::text = (storage.foldername(name))[1]
-- after real auth lands.

-- ---------------------------------------------------------------------------
-- profiles.avatar_url already exists in 20261103_qt_storage.sql — ensure it
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

-- Allow clients to persist avatar_url (select already granted in QT migration)
grant update on public.profiles to anon, authenticated;

drop policy if exists "profiles_update_anon" on public.profiles;
create policy "profiles_update_anon"
  on public.profiles for update
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage RLS (bucket-scoped; path convention enforced in app)
-- ---------------------------------------------------------------------------
drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_anon" on storage.objects;
drop policy if exists "avatars_update_anon" on storage.objects;
drop policy if exists "avatars_delete_anon" on storage.objects;

create policy "avatars_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'avatars');

create policy "avatars_update_anon"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

create policy "avatars_delete_anon"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'avatars');
