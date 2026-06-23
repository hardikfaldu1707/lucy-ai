-- Text chat: 1 coin every 2 user messages (per conversation).
-- economy.cost.text = coins charged when a billing cycle triggers.
-- economy.text.messages_per_charge = bill every N user messages in a conversation.

insert into app_settings(key, value, updated_at)
values ('economy.cost.text', '1'::jsonb, now())
on conflict (key) do update set value = '1'::jsonb, updated_at = now();

insert into app_settings(key, value, updated_at)
values ('economy.text.messages_per_charge', '2'::jsonb, now())
on conflict (key) do update set value = '2'::jsonb, updated_at = now();

update action_costs set cost = 1 where action_type = 'text';
