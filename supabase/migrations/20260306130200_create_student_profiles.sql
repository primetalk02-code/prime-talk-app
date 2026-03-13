-- Create student_profiles table
create table if not exists student_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  native_language text,
  learning_goal text,
  level text,
  created_at timestamp default now()
);
