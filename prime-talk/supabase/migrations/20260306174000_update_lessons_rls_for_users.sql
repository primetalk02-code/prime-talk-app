drop policy if exists "students_insert_own_lessons" on public.lessons;

create policy "students_insert_own_lessons"
on public.lessons
for insert
to authenticated
with check (
  auth.uid() = student_id
  and exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'student'
  )
);
