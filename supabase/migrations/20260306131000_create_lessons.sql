-- Compatibility migration for existing lessons table.
-- The original lessons table was created earlier. Keep this migration idempotent
-- by only adding backward-compatible columns.
alter table if exists public.lessons
  add column if not exists lesson_type text;

alter table if exists public.lessons
  add column if not exists daily_room_name text;

alter table if exists public.lessons
  add column if not exists daily_room_url text;

alter table if exists public.lessons
  add column if not exists recording_url text;

alter table if exists public.lessons
  add column if not exists scheduled_start timestamp with time zone;

alter table if exists public.lessons
  add column if not exists started_at timestamp with time zone;

alter table if exists public.lessons
  add column if not exists ended_at timestamp with time zone;

alter table if exists public.lessons
  drop constraint if exists lessons_lesson_type_check;

alter table if exists public.lessons
  add constraint lessons_lesson_type_check
  check (lesson_type is null or lesson_type in ('instant', 'reservation'));
