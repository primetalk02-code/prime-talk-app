alter table if exists public.lessons
  alter column status set default 'waiting';

alter table if exists public.lessons
  drop constraint if exists lessons_status_check;

alter table if exists public.lessons
  add constraint lessons_status_check
  check (status in ('waiting', 'in_progress', 'completed', 'declined', 'active', 'finished'));

do $$
begin
  if to_regclass('public.lessons') is not null
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'lessons'
     ) then
    alter publication supabase_realtime add table public.lessons;
  end if;
end $$;
