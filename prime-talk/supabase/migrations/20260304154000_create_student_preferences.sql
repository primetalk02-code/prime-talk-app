create table if not exists public.student_preferences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users (id) on delete cascade unique,
  need_self_intro boolean default false,
  correct_mistakes boolean default true,
  lesson_style text,
  created_at timestamp with time zone default now()
);
