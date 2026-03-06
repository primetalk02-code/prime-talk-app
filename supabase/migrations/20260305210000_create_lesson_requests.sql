create table if not exists public.lesson_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone not null default now()
);

create index if not exists lesson_requests_teacher_status_created_at_idx
  on public.lesson_requests (teacher_id, status, created_at desc);

create index if not exists lesson_requests_student_status_created_at_idx
  on public.lesson_requests (student_id, status, created_at desc);

grant select, insert, update on table public.lesson_requests to authenticated;

alter table public.lesson_requests enable row level security;

drop policy if exists "students_insert_own_lesson_requests" on public.lesson_requests;
create policy "students_insert_own_lesson_requests"
on public.lesson_requests
for insert
to authenticated
with check (
  auth.uid() = student_id
);

drop policy if exists "participants_select_lesson_requests" on public.lesson_requests;
create policy "participants_select_lesson_requests"
on public.lesson_requests
for select
to authenticated
using (
  auth.uid() = teacher_id
  or auth.uid() = student_id
);

drop policy if exists "teachers_update_own_lesson_requests" on public.lesson_requests;
create policy "teachers_update_own_lesson_requests"
on public.lesson_requests
for update
to authenticated
using (
  auth.uid() = teacher_id
)
with check (
  auth.uid() = teacher_id
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lesson_requests'
  ) then
    alter publication supabase_realtime add table public.lesson_requests;
  end if;
end $$;
