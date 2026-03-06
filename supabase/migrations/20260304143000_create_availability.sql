create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  time_slot time not null,
  status text not null default 'available' check (status in ('available', 'booked', 'cancelled')),
  created_at timestamp with time zone not null default now(),
  unique (teacher_id, date, time_slot)
);

grant select, insert, update on table public.availability to authenticated;

alter table public.availability enable row level security;

drop policy if exists "teachers_select_own_availability" on public.availability;
create policy "teachers_select_own_availability"
on public.availability
for select
to authenticated
using (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "teachers_insert_own_availability" on public.availability;
create policy "teachers_insert_own_availability"
on public.availability
for insert
to authenticated
with check (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "teachers_update_own_availability" on public.availability;
create policy "teachers_update_own_availability"
on public.availability
for update
to authenticated
using (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
)
with check (
  auth.uid() = teacher_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  )
);

drop policy if exists "students_select_available_availability" on public.availability;
create policy "students_select_available_availability"
on public.availability
for select
to authenticated
using (
  status = 'available'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
);
