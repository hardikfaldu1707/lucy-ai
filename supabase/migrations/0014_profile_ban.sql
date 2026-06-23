-- Account suspension. A banned user keeps their data but is blocked from the
-- app (enforced server-side in the dashboard layout + sensitive API routes).
alter table profiles add column if not exists is_banned boolean not null default false;
alter table profiles add column if not exists banned_reason text;
