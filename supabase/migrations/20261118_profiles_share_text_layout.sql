-- Per-user QT share/copy text layout (계정 설정).
-- titled = date+range + field titles + content (default)
-- plain  = date+range + contents only

alter table public.profiles
  add column if not exists share_text_layout text not null default 'titled';

alter table public.profiles
  drop constraint if exists profiles_share_text_layout_check;

alter table public.profiles
  add constraint profiles_share_text_layout_check
  check (share_text_layout in ('titled', 'plain'));

comment on column public.profiles.share_text_layout is
  'QT clipboard/Kakao text layout: titled (field titles) or plain (contents only)';
