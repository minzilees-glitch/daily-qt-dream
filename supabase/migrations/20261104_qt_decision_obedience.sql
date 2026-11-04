-- Add 「오늘 나의 결단과 순종」 column to qt_entries.
-- Paste into Supabase Dashboard → SQL Editor → Run if not applied via CLI.

alter table public.qt_entries
  add column if not exists decision_obedience text not null default '';
