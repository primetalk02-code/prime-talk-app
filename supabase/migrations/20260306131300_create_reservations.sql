-- Create reservations table
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid references lessons(id),
  teacher_id uuid references profiles(id),
  student_id uuid references profiles(id),
  reservation_time timestamp,
  lesson_request jsonb,
  status text check (status in ('booked','completed','cancelled')),
  created_at timestamp default now()
);
