create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.reservations (id) on delete cascade,
  teacher_id uuid references auth.users (id) on delete cascade,
  student_id uuid references auth.users (id) on delete cascade,
  content text,
  created_at timestamp with time zone default now()
);
