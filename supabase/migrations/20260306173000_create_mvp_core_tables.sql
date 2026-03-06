create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'User',
  role text not null check (role in ('teacher', 'student')),
  created_at timestamp with time zone not null default now()
);

grant select, insert, update on table public.users to authenticated;

alter table public.users enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
on public.users
for select
to authenticated
using (true);

drop policy if exists "users_insert_own_row" on public.users;
create policy "users_insert_own_row"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_update_own_row" on public.users;
create policy "users_update_own_row"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users (id) on delete cascade,
  day date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (teacher_id, day),
  check (end_time > start_time)
);

grant select, insert, update, delete on table public.teacher_availability to authenticated;

alter table public.teacher_availability enable row level security;

drop policy if exists "teacher_availability_select_authenticated" on public.teacher_availability;
create policy "teacher_availability_select_authenticated"
on public.teacher_availability
for select
to authenticated
using (true);

drop policy if exists "teacher_availability_insert_own" on public.teacher_availability;
create policy "teacher_availability_insert_own"
on public.teacher_availability
for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "teacher_availability_update_own" on public.teacher_availability;
create policy "teacher_availability_update_own"
on public.teacher_availability
for update
to authenticated
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "teacher_availability_delete_own" on public.teacher_availability;
create policy "teacher_availability_delete_own"
on public.teacher_availability
for delete
to authenticated
using (auth.uid() = teacher_id);

alter table if exists public.lessons
  add column if not exists start_time timestamp with time zone;

create table if not exists public.lesson_history (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  duration_completed integer not null default 0 check (duration_completed >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

grant select, insert, update on table public.lesson_history to authenticated;

alter table public.lesson_history enable row level security;

drop policy if exists "lesson_history_select_participants" on public.lesson_history;
create policy "lesson_history_select_participants"
on public.lesson_history
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (auth.uid() = l.student_id or auth.uid() = l.teacher_id)
  )
);

drop policy if exists "lesson_history_insert_participants" on public.lesson_history;
create policy "lesson_history_insert_participants"
on public.lesson_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (auth.uid() = l.student_id or auth.uid() = l.teacher_id)
  )
);

drop policy if exists "lesson_history_update_participants" on public.lesson_history;
create policy "lesson_history_update_participants"
on public.lesson_history
for update
to authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (auth.uid() = l.student_id or auth.uid() = l.teacher_id)
  )
)
with check (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and (auth.uid() = l.student_id or auth.uid() = l.teacher_id)
  )
);

do $$
begin
  if to_regclass('public.profiles') is not null then
    insert into public.users (id, name, role)
    select
      p.id,
      coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.name), ''), nullif(trim(p.display_name), ''), 'User') as name,
      case when p.role = 'teacher' then 'teacher' else 'student' end as role
    from public.profiles p
    where not exists (
      select 1
      from public.users u
      where u.id = p.id
    );
  end if;
end $$;
