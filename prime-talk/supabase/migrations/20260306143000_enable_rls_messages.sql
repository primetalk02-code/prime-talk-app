grant select, insert on table public.messages to authenticated;

alter table public.messages enable row level security;

drop policy if exists "participants_select_messages" on public.messages;
create policy "participants_select_messages"
on public.messages
for select
to authenticated
using (
  auth.uid() = teacher_id
  or auth.uid() = student_id
);

drop policy if exists "students_insert_messages" on public.messages;
create policy "students_insert_messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = student_id
);

drop policy if exists "teachers_insert_messages" on public.messages;
create policy "teachers_insert_messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = teacher_id
);

do $$
begin
  if to_regclass('public.messages') is not null
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
