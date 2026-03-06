alter table if exists public.lessons
  add column if not exists duration integer;

alter table if exists public.lessons
  add column if not exists textbook text;

alter table if exists public.lessons
  add column if not exists started_at timestamp with time zone;

alter table if exists public.lessons
  add column if not exists ended_at timestamp with time zone;

