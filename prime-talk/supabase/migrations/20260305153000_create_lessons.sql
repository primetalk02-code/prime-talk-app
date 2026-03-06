create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  room_url text not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  created_at timestamp with time zone not null default now()
);

create index if not exists lessons_teacher_status_created_at_idx
  on public.lessons (teacher_id, status, created_at desc);

create index if not exists lessons_student_status_created_at_idx
  on public.lessons (student_id, status, created_at desc);

grant select, insert, update on table public.lessons to authenticated;

alter table public.lessons enable row level security;

drop policy if exists "students_insert_own_lessons" on public.lessons;
create policy "students_insert_own_lessons"
on public.lessons
for insert
to authenticated
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
  )
);

drop policy if exists "participants_select_own_lessons" on public.lessons;
create policy "participants_select_own_lessons"
on public.lessons
for select
to authenticated
using (
  auth.uid() = teacher_id
  or auth.uid() = student_id
);

drop policy if exists "participants_update_own_lessons" on public.lessons;
create policy "participants_update_own_lessons"
on public.lessons
for update
to authenticated
using (
  auth.uid() = teacher_id
  or auth.uid() = student_id
)
with check (
  auth.uid() = teacher_id
  or auth.uid() = student_id
);
