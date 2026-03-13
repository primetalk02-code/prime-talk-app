-- Create teacher_availability_slots table
create table if not exists teacher_availability_slots (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references profiles(id),
  day_of_week integer,
  start_time time,
  end_time time,
  enabled boolean default true
);
