-- Server-side coin spend via service role (Clerk JWT is not available to PostgREST).
-- App verifies Clerk auth, then calls this with explicit profile_id.

create or replace function spend_coins_for_profile(
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
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_profile_id is null or p_profile_id = '' then
    raise exception 'profile_id required';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_reason not in ('spend_text','spend_image','spend_voice','adjustment') then
    raise exception 'invalid spend reason %', p_reason;
  end if;

  if p_idempotency_key is not null and exists (
    select 1 from coin_ledger
    where profile_id = p_profile_id and idempotency_key = p_idempotency_key
  ) then
    select balance into v_balance from coin_balances where profile_id = p_profile_id;
    return v_balance;
  end if;

  select balance into v_balance
  from coin_balances where profile_id = p_profile_id
  for update;

  if v_balance is null then
    raise exception 'no balance row' using errcode = 'P0002';
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_coins' using errcode = 'P0001';
  end if;

  v_balance := v_balance - p_amount;

  insert into coin_ledger(profile_id, amount, reason, balance_after, metadata, idempotency_key)
  values (p_profile_id, -p_amount, p_reason, v_balance, p_metadata, p_idempotency_key);

  update coin_balances set balance = v_balance, updated_at = now()
  where profile_id = p_profile_id;

  return v_balance;
end;
$$;

revoke all on function spend_coins_for_profile(text, integer, coin_reason, jsonb, text)
  from public, anon, authenticated;
grant execute on function spend_coins_for_profile(text, integer, coin_reason, jsonb, text)
  to service_role;

-- Product default: 2 coins per text message.
update action_costs set cost = 2 where action_type = 'text';
