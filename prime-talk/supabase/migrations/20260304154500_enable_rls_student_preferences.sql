grant select, insert, update, delete on table public.student_preferences to authenticated;

alter table public.student_preferences enable row level security;

drop policy if exists "students_select_own_preferences" on public.student_preferences;
create policy "students_select_own_preferences"
on public.student_preferences
for select
to authenticated
using (auth.uid() = student_id);

drop policy if exists "students_insert_own_preferences" on public.student_preferences;
create policy "students_insert_own_preferences"
on public.student_preferences
for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "students_update_own_preferences" on public.student_preferences;
create policy "students_update_own_preferences"
on public.student_preferences
for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "students_delete_own_preferences" on public.student_preferences;
create policy "students_delete_own_preferences"
on public.student_preferences
for delete
to authenticated
using (auth.uid() = student_id);
