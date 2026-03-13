-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  email text,
  role text check (role in ('student','teacher','admin')),
  created_at timestamp default now()
);
