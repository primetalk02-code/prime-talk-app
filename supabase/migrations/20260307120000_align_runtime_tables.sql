-- Align runtime schema used by current application code.

alter table if exists public.reservations
  add column if not exists room_id uuid;

alter table if exists public.reservations
  add column if not exists lesson_date date;

alter table if exists public.reservations
  add column if not exists lesson_time time without time zone;

alter table if exists public.reservations
  add column if not exists lesson_request jsonb;

alter table if exists public.reservations
  add column if not exists reservation_time timestamp with time zone;

update public.reservations
set room_id = lesson_id
where room_id is null
  and lesson_id is not null;

do $$
begin
  if to_regclass('public.reservations') is not null
     and to_regclass('public.lessons') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'reservations_room_id_fkey'
     ) then
    alter table public.reservations
      add constraint reservations_room_id_fkey
      foreign key (room_id)
      references public.lessons (id)
      on delete set null;
  end if;
end $$;

alter table if exists public.lesson_history
  add column if not exists teacher_id uuid;

alter table if exists public.lesson_history
  add column if not exists student_id uuid;

alter table if exists public.lesson_history
  add column if not exists started_at timestamp with time zone;

alter table if exists public.lesson_history
  add column if not exists ended_at timestamp with time zone;

create index if not exists reservations_room_id_idx
  on public.reservations (room_id);

create index if not exists reservations_teacher_student_date_idx
  on public.reservations (teacher_id, student_id, lesson_date, lesson_time);

