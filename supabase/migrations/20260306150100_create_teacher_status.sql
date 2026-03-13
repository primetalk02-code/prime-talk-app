-- Compatibility migration for teacher_status table.
alter table if exists public.teacher_status
  add column if not exists available_for_reservations boolean not null default false;

alter table if exists public.teacher_status
  add column if not exists updated_at timestamp with time zone default now();

alter table if exists public.teacher_status
  drop constraint if exists teacher_status_status_check;

alter table if exists public.teacher_status
  add constraint teacher_status_status_check
  check (status in ('offline', 'online', 'standby', 'busy', 'standby_for_reservation'));

create index if not exists idx_teacher_status_teacher_id
  on public.teacher_status(teacher_id);
