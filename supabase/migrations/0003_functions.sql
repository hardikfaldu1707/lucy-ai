-- Lucy AI — atomic coin RPCs + reconciliation view.
-- spend_coins/grant_coins are SECURITY DEFINER so they can write coin_* despite
-- RLS, but they pin the actor to the JWT sub (spend) or require admin/service role (grant).

-- ---------------- spend_coins: atomic debit ----------------
create or replace function spend_coins(
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
  v_profile text := auth.jwt()->>'sub';
  v_balance integer;
begin
  if v_profile is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  if p_reason not in ('spend_text','spend_image','spend_voice','adjustment') then
    raise exception 'invalid spend reason %', p_reason;
  end if;

  -- Idempotency: replaying the same key returns the current balance, no double charge.
  if p_idempotency_key is not null and exists (
    select 1 from coin_ledger
    where profile_id = v_profile and idempotency_key = p_idempotency_key
  ) then
    select balance into v_balance from coin_balances where profile_id = v_profile;
    return v_balance;
  end if;

  select balance into v_balance
  from coin_balances where profile_id = v_profile
  for update;

  if v_balance is null then
    raise exception 'no balance row' using errcode = 'P0002';
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_coins' using errcode = 'P0001';
  end if;

  v_balance := v_balance - p_amount;

  insert into coin_ledger(profile_id, amount, reason, balance_after, metadata, idempotency_key)
  values (v_profile, -p_amount, p_reason, v_balance, p_metadata, p_idempotency_key);

  update coin_balances set balance = v_balance, updated_at = now()
  where profile_id = v_profile;

  return v_balance;
end;
$$;

-- ---------------- grant_coins: credit (admin or service role) ----------------
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
  -- auth.jwt() is null when called with the service role key (renewals/webhook).
  if auth.jwt() is not null and not is_admin() then
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

-- Lock down execution.
revoke all on function spend_coins(integer, coin_reason, jsonb, text) from public;
grant execute on function spend_coins(integer, coin_reason, jsonb, text) to authenticated;
revoke all on function grant_coins(text, integer, coin_reason, jsonb, text) from public;
grant execute on function grant_coins(text, integer, coin_reason, jsonb, text) to authenticated, service_role;

-- Integrity check: cached balance vs ledger sum (drift should always be 0).
create or replace view coin_balance_check as
select b.profile_id,
       b.balance                  as cached_balance,
       coalesce(l.ledger_sum, 0)  as ledger_balance,
       b.balance - coalesce(l.ledger_sum, 0) as drift
from coin_balances b
left join (
  select profile_id, sum(amount) as ledger_sum
  from coin_ledger group by profile_id
) l on l.profile_id = b.profile_id;
