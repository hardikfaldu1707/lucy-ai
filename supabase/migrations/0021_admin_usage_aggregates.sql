-- SQL aggregates for admin analytics (avoids full-table scans in Node).

create or replace function admin_ai_usage_totals()
returns table (replies bigint, total_tokens bigint, cost_usd numeric)
language sql security definer set search_path = public stable as $$
  select count(*)::bigint,
         coalesce(sum(total_tokens), 0)::bigint,
         coalesce(sum(cost_usd), 0)
  from ai_usage_log;
$$;

create or replace function admin_ai_usage_by_model()
returns table (model text, replies bigint, total_tokens bigint, cost_usd numeric)
language sql security definer set search_path = public stable as $$
  select model,
         count(*)::bigint,
         coalesce(sum(total_tokens), 0)::bigint,
         coalesce(sum(cost_usd), 0)
  from ai_usage_log
  group by model
  order by coalesce(sum(cost_usd), 0) desc;
$$;

create or replace function admin_ai_usage_by_character()
returns table (character_id uuid, replies bigint, total_tokens bigint, cost_usd numeric)
language sql security definer set search_path = public stable as $$
  select character_id,
         count(*)::bigint,
         coalesce(sum(total_tokens), 0)::bigint,
         coalesce(sum(cost_usd), 0)
  from ai_usage_log
  where character_id is not null
  group by character_id
  order by count(*) desc;
$$;

create or replace function admin_ai_cost_by_profile()
returns table (profile_id text, cost_usd numeric)
language sql security definer set search_path = public stable as $$
  select profile_id, coalesce(sum(cost_usd), 0)
  from ai_usage_log
  where profile_id is not null
  group by profile_id;
$$;

create or replace function admin_billing_revenue_by_profile()
returns table (profile_id text, revenue_usd numeric)
language sql security definer set search_path = public stable as $$
  select profile_id, coalesce(sum(amount), 0)
  from billing_records
  where status = 'paid'
  group by profile_id;
$$;

revoke all on function admin_ai_usage_totals() from public;
revoke all on function admin_ai_usage_by_model() from public;
revoke all on function admin_ai_usage_by_character() from public;
revoke all on function admin_ai_cost_by_profile() from public;
revoke all on function admin_billing_revenue_by_profile() from public;
grant execute on function admin_ai_usage_totals() to service_role;
grant execute on function admin_ai_usage_by_model() to service_role;
grant execute on function admin_ai_usage_by_character() to service_role;
grant execute on function admin_ai_cost_by_profile() to service_role;
grant execute on function admin_billing_revenue_by_profile() to service_role;
