-- Per-reply AI usage + cost log. One row per assistant reply.
-- Written by the chat route via the service-role client (bypasses RLS).
-- Readable by admins only (analytics); never exposed to end users.

create table if not exists ai_usage_log (
  id                uuid primary key default gen_random_uuid(),
  profile_id        text references profiles(id) on delete set null,
  character_id      uuid references characters(id) on delete set null,
  model             text not null,
  prompt_tokens     integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens      integer not null default 0,
  cost_usd          numeric(12,6) not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists ai_usage_log_model_idx on ai_usage_log (model);
create index if not exists ai_usage_log_character_idx on ai_usage_log (character_id);
create index if not exists ai_usage_log_created_idx on ai_usage_log (created_at);

alter table ai_usage_log enable row level security;

-- Admins read; inserts happen only via the service-role client (no insert policy).
create policy ai_usage_admin_read on ai_usage_log
  for select using (is_admin());
