-- Text chat costs 2 coins per message. The live cost is read from the
-- `economy.cost.text` app_settings row (falling back to the ACTION_COST.text
-- code default). Seed it explicitly so the price is exactly 2 in every
-- environment, regardless of any prior admin override.

insert into app_settings(key, value, updated_at)
values ('economy.cost.text', '2'::jsonb, now())
on conflict (key) do update set value = '2'::jsonb, updated_at = now();

-- Keep the (currently unused) action_costs table consistent with the live cost.
update action_costs set cost = 2 where action_type = 'text';
