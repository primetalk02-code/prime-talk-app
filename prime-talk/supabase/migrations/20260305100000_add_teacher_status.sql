alter table if exists public.profiles
add column if not exists status text default 'offline';

alter table if exists public.profiles
alter column status set default 'offline';

update public.profiles
set status = 'offline'
where status is null;
