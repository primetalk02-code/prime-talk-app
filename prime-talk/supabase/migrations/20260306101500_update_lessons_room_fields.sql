alter table if exists public.lessons
  alter column room_url drop not null;

alter table if exists public.lessons
  add column if not exists room_name text;

alter table if exists public.lessons
  add column if not exists source text not null default 'sudden';

alter table if exists public.lessons
  drop constraint if exists lessons_source_check;

alter table if exists public.lessons
  add constraint lessons_source_check
  check (source in ('sudden', 'reservation'));