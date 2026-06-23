-- Prevent authenticated users from self-modifying privileged profile columns via RLS client.

create or replace function profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / migrations bypass (no JWT).
  if auth.jwt() is null then
    return new;
  end if;
  if is_admin() then
    return new;
  end if;
  new.is_admin := old.is_admin;
  new.plan := old.plan;
  new.is_banned := old.is_banned;
  new.banned_reason := old.banned_reason;
  new.email := old.email;
  new.email_verified := old.email_verified;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on profiles;
create trigger profiles_guard_privileged_columns
  before update on profiles
  for each row execute function profiles_guard_privileged_columns();
