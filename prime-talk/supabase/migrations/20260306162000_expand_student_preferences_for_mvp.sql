alter table if exists public.student_preferences
  add column if not exists lesson_duration integer not null default 15;

alter table if exists public.student_preferences
  add column if not exists textbook text;

alter table if exists public.student_preferences
  add column if not exists preferred_teacher_type text;

alter table if exists public.student_preferences
  add column if not exists preferred_lesson_time text not null default 'now';

update public.student_preferences
set lesson_duration = 15
where lesson_duration is null;

update public.student_preferences
set preferred_lesson_time = 'now'
where preferred_lesson_time is null;

alter table if exists public.student_preferences
  drop constraint if exists student_preferences_lesson_duration_check;

alter table if exists public.student_preferences
  add constraint student_preferences_lesson_duration_check
  check (lesson_duration in (5, 10, 15, 20, 25));

alter table if exists public.student_preferences
  drop constraint if exists student_preferences_preferred_lesson_time_check;

alter table if exists public.student_preferences
  add constraint student_preferences_preferred_lesson_time_check
  check (preferred_lesson_time in ('now', 'scheduled'));
