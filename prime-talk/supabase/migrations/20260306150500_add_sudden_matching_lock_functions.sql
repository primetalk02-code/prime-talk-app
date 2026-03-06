create or replace function public.acquire_sudden_matching_lock()
returns boolean
language plpgsql
security definer
as $$
declare
  got_lock boolean;
begin
  select pg_try_advisory_lock(12345) into got_lock;
  return got_lock;
end;
$$;

revoke all on function public.acquire_sudden_matching_lock() from public;
grant execute on function public.acquire_sudden_matching_lock() to authenticated;

create or replace function public.release_sudden_matching_lock()
returns void
language plpgsql
security definer
as $$
begin
  perform pg_advisory_unlock(12345);
end;
$$;

revoke all on function public.release_sudden_matching_lock() from public;
grant execute on function public.release_sudden_matching_lock() to authenticated;

