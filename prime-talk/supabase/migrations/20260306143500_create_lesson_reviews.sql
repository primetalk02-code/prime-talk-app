create table if not exists public.lesson_reviews (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone not null default now(),
  unique (lesson_id, student_id)
);

create index if not exists lesson_reviews_teacher_created_idx
  on public.lesson_reviews (teacher_id, created_at desc);

create index if not exists lesson_reviews_student_created_idx
  on public.lesson_reviews (student_id, created_at desc);

grant select, insert, update, delete on table public.lesson_reviews to authenticated;

alter table public.lesson_reviews enable row level security;

drop policy if exists "participants_select_lesson_reviews" on public.lesson_reviews;
create policy "participants_select_lesson_reviews"
on public.lesson_reviews
for select
to authenticated
using (
  auth.uid() = teacher_id
  or auth.uid() = student_id
);

drop policy if exists "students_insert_lesson_reviews" on public.lesson_reviews;
create policy "students_insert_lesson_reviews"
on public.lesson_reviews
for insert
to authenticated
with check (
  auth.uid() = student_id
);

drop policy if exists "students_update_lesson_reviews" on public.lesson_reviews;
create policy "students_update_lesson_reviews"
on public.lesson_reviews
for update
to authenticated
using (
  auth.uid() = student_id
)
with check (
  auth.uid() = student_id
);

drop policy if exists "students_delete_lesson_reviews" on public.lesson_reviews;
create policy "students_delete_lesson_reviews"
on public.lesson_reviews
for delete
to authenticated
using (
  auth.uid() = student_id
);
