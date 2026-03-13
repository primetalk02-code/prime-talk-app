-- Create teacher_applications table
create table if not exists teacher_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  status text check (status in ('pending','approved','rejected')) default 'pending',
  bio text,
  languages text[],
  experience text,
  introduction_video_url text,
  hourly_rate numeric,
  created_at timestamp default now()
);
