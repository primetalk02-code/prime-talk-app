-- Create teacher_status table
create table if not exists teacher_status (
  teacher_id uuid primary key references profiles(id),
  status text check (status in ('offline','online','standby','busy')),
  available_for_reservations boolean default false,
  updated_at timestamp default now()
);
