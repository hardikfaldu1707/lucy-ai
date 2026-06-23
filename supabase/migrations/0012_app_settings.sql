-- Platform key/value settings (feature flags, etc.). Values are jsonb so a flag
-- can be a boolean today and a richer config later.

create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

-- World-readable so the app can read flags at runtime; only admins write.
create policy app_settings_read on app_settings
  for select using (true);
create policy app_settings_admin_write on app_settings
  for all using (is_admin()) with check (is_admin());
