-- Compatibility migration for reservations table.
alter table if exists public.reservations
  add column if not exists slot_id uuid;

alter table if exists public.reservations
  add column if not exists textbook text;

alter table if exists public.reservations
  add column if not exists preferences jsonb;

alter table if exists public.reservations
  add column if not exists extra_request text;

alter table if exists public.reservations
  drop constraint if exists reservations_status_check;

alter table if exists public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'booked', 'cancelled', 'completed'));
