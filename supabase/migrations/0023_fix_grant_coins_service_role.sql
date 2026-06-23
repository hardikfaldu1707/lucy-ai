-- Fix grant_coins service-role authorization.
-- PostgREST attaches a JWT with role=service_role for service-role requests;
-- auth.jwt() is NOT null, so the old check rejected all server-side grants.

create or replace function grant_coins(
  p_profile_id text,
  p_amount integer,
  p_reason coin_reason,
  p_metadata jsonb default '{}',
  p_idempotency_key text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  -- Block authenticated non-admins. Allow service_role (PostgREST), direct
  -- postgres/migration calls (auth.role() null), and Clerk admin JWTs.
  if coalesce(auth.role(), '') = 'authenticated' and not is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if p_idempotency_key is not null and exists (
    select 1 from coin_ledger
    where profile_id = p_profile_id and idempotency_key = p_idempotency_key
  ) then
    select balance into v_balance from coin_balances where profile_id = p_profile_id;
    return v_balance;
  end if;

  insert into coin_balances(profile_id, balance)
  values (p_profile_id, p_amount)
  on conflict (profile_id) do update
    set balance = coin_balances.balance + excluded.balance,
        updated_at = now()
  returning balance into v_balance;

  insert into coin_ledger(profile_id, amount, reason, balance_after, metadata, idempotency_key)
  values (p_profile_id, p_amount, p_reason, v_balance, p_metadata, p_idempotency_key);

  return v_balance;
end;
$$;

-- Backfill signup bonus for profiles that never received it (idempotent).
do $$
declare
  r record;
begin
  for r in
    select p.id
    from profiles p
    where not exists (
      select 1 from coin_ledger cl
      where cl.profile_id = p.id
        and cl.idempotency_key = 'signup:' || p.id
    )
  loop
    perform grant_coins(
      r.id,
      100,
      'signup_bonus'::coin_reason,
      '{}'::jsonb,
      'signup:' || r.id
    );
  end loop;
end;
$$;
