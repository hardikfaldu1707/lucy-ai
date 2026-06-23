-- RLS for v2 platform tables introduced in 0015_v2_platform.sql
-- Idempotent: safe to re-run if policies were already created (e.g. via MCP or partial apply).

alter table analytics_events enable row level security;
alter table push_subscriptions enable row level security;
alter table tenants enable row level security;

-- Analytics: admin read-only; writes via service role (trackEvent).
drop policy if exists analytics_events_admin_read on analytics_events;
create policy analytics_events_admin_read on analytics_events
  for select using (is_admin());

-- Push subscriptions: users manage their own rows (future client writes).
drop policy if exists push_subscriptions_select_own on push_subscriptions;
create policy push_subscriptions_select_own on push_subscriptions
  for select using (profile_id = current_profile_id() or is_admin());

drop policy if exists push_subscriptions_insert_own on push_subscriptions;
create policy push_subscriptions_insert_own on push_subscriptions
  for insert with check (profile_id = current_profile_id());

drop policy if exists push_subscriptions_delete_own on push_subscriptions;
create policy push_subscriptions_delete_own on push_subscriptions
  for delete using (profile_id = current_profile_id() or is_admin());

-- Tenants: active branding is world-readable.
drop policy if exists tenants_read_active on tenants;
create policy tenants_read_active on tenants
  for select using (is_active = true or is_admin());

drop policy if exists tenants_admin_write on tenants;
create policy tenants_admin_write on tenants
  for all using (is_admin()) with check (is_admin());
