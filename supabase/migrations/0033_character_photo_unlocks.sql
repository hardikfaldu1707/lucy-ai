-- Paid unlocks for catalog character gallery photos (5 coins each via app layer).

alter type coin_reason add value if not exists 'spend_photo';

create table if not exists character_photo_unlocks (
  id            uuid primary key default gen_random_uuid(),
  profile_id    text not null references profiles(id) on delete cascade,
  character_id  uuid not null references characters(id) on delete cascade,
  photo_url     text not null,
  created_at    timestamptz not null default now(),
  unique (profile_id, character_id, photo_url)
);

create index if not exists character_photo_unlocks_profile_idx
  on character_photo_unlocks (profile_id, character_id);

alter table character_photo_unlocks enable row level security;

drop policy if exists character_photo_unlocks_select_own on character_photo_unlocks;
create policy character_photo_unlocks_select_own on character_photo_unlocks
  for select using (profile_id = current_profile_id());

-- Allow spend_photo in service-role spend function.
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
  if p_reason not in ('spend_text','spend_image','spend_voice','spend_photo','adjustment') then
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

insert into app_settings (key, value, updated_at)
values ('economy.cost.profile_photo', '5'::jsonb, now())
on conflict (key) do nothing;
