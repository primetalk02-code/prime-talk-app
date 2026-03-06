alter table if exists public.profiles
  add column if not exists availability boolean not null default true;

alter table if exists public.profiles
  add column if not exists last_active timestamp with time zone not null default now();

create index if not exists profiles_teacher_matching_idx
  on public.profiles (role, online_status, availability, last_active);
