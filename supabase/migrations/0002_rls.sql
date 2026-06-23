-- Lucy AI — Row-Level Security helpers + policies.
-- Owner = Clerk user id from the verified JWT. Admins (Clerk role claim) read all.
-- Service-role connections bypass RLS entirely (used by the Clerk webhook).

-- Clerk user id from the verified third-party JWT.
create or replace function current_profile_id() returns text
language sql stable as $$
  select auth.jwt()->>'sub';
$$;

-- Admin check from the Clerk session-token claim metadata.role === 'admin'.
create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt()->'metadata'->>'role') = 'admin', false);
$$;

-- Enable RLS everywhere.
alter table profiles        enable row level security;
alter table characters      enable row level security;
alter table user_characters enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table memories        enable row level security;
alter table user_settings   enable row level security;
alter table subscriptions   enable row level security;
alter table coin_balances   enable row level security;
alter table coin_ledger     enable row level security;
alter table action_costs    enable row level security;
alter table media_assets    enable row level security;
alter table notifications   enable row level security;
alter table billing_records enable row level security;

-- -------- PROFILES (read own + admin; update own; insert/delete via service role only) --------
create policy profiles_select_own on profiles
  for select using (id = current_profile_id() or is_admin());
create policy profiles_update_own on profiles
  for update using (id = current_profile_id()) with check (id = current_profile_id());

-- -------- CHARACTERS (catalog: world-readable; admin write) --------
create policy characters_read_all on characters
  for select using (is_published or is_admin());
create policy characters_admin_write on characters
  for all using (is_admin()) with check (is_admin());

-- -------- ACTION_COSTS (read by all authenticated; admin write) --------
create policy action_costs_read on action_costs
  for select using (true);
create policy action_costs_admin_write on action_costs
  for all using (is_admin()) with check (is_admin());

-- -------- Per-user owner-only tables --------
create policy uc_owner_all on user_characters
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

create policy conv_owner_all on conversations
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

create policy msg_owner_all on messages
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

create policy mem_owner_all on memories
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

create policy settings_owner_all on user_settings
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

create policy media_owner_all on media_assets
  for all using (profile_id = current_profile_id() or is_admin())
  with check (profile_id = current_profile_id());

-- -------- Read-only-to-user tables (writes via RPC / service role only) --------
create policy sub_select_own on subscriptions
  for select using (profile_id = current_profile_id() or is_admin());

create policy ledger_select_own on coin_ledger
  for select using (profile_id = current_profile_id() or is_admin());

create policy balance_select_own on coin_balances
  for select using (profile_id = current_profile_id() or is_admin());

-- -------- NOTIFICATIONS (read + mark-read by owner; create via service role) --------
create policy notif_select_own on notifications
  for select using (profile_id = current_profile_id() or is_admin());
create policy notif_update_own on notifications
  for update using (profile_id = current_profile_id())
  with check (profile_id = current_profile_id());

-- -------- BILLING (owner + admin read; admin write) --------
create policy billing_select on billing_records
  for select using (profile_id = current_profile_id() or is_admin());
create policy billing_admin_write on billing_records
  for all using (is_admin()) with check (is_admin());
