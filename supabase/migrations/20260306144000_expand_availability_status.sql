
alter table if exists public.availability
  drop constraint if exists availability_status_check;

alter table if exists public.availability
  add constraint availability_status_check
  check (status in ('available', 'booked', 'cancelled', 'unavailable'));
