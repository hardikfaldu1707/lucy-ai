-- Idempotent repair: replay 0006–0014 changes missing on remote DB.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- 0007: per-character AI model
alter table characters add column if not exists ai_model text;

-- 0008: system prompt, ownership, visibility + RLS
alter table characters add column if not exists system_prompt text;
alter table characters add column if not exists created_by text
  references profiles(id) on delete set null;
alter table characters add column if not exists visibility text not null default 'public';

drop policy if exists characters_read_all on characters;
create policy characters_read_all on characters
  for select using (
    (is_published and visibility = 'public')
    or created_by = current_profile_id()
    or is_admin()
  );

-- 0009: AI usage log
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
drop policy if exists ai_usage_admin_read on ai_usage_log;
create policy ai_usage_admin_read on ai_usage_log
  for select using (is_admin());

-- 0010: chat privacy (owner-only, no admin read)
drop policy if exists msg_owner_all on messages;
create policy msg_owner_all on messages
  for all using (
    profile_id = current_profile_id()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.profile_id = current_profile_id()
    )
  )
  with check (
    profile_id = current_profile_id()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.profile_id = current_profile_id()
    )
  );

drop policy if exists conv_owner_all on conversations;
create policy conv_owner_all on conversations
  for all using (profile_id = current_profile_id())
  with check (profile_id = current_profile_id());

create or replace function admin_message_stats()
returns table (character_id uuid, total_messages bigint, unique_users bigint)
language sql security definer set search_path = public stable as $$
  select c.character_id,
         count(*)::bigint as total_messages,
         count(distinct c.profile_id)::bigint as unique_users
  from messages m
  join conversations c on c.id = m.conversation_id
  where is_admin()
  group by c.character_id;
$$;

-- 0011: reports
do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     text references profiles(id) on delete set null,
  character_id    uuid references characters(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  category        text not null default 'other',
  reason          text,
  status          report_status not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists reports_status_idx on reports (status);
create index if not exists reports_created_idx on reports (created_at);
alter table reports enable row level security;
drop policy if exists reports_insert_own on reports;
create policy reports_insert_own on reports
  for insert with check (reporter_id = current_profile_id());
drop policy if exists reports_select on reports;
create policy reports_select on reports
  for select using (reporter_id = current_profile_id() or is_admin());
drop policy if exists reports_admin_update on reports;
create policy reports_admin_update on reports
  for update using (is_admin()) with check (is_admin());

-- 0012: app_settings policies
drop policy if exists app_settings_read on app_settings;
create policy app_settings_read on app_settings
  for select using (true);
drop policy if exists app_settings_admin_write on app_settings;
create policy app_settings_admin_write on app_settings
  for all using (is_admin()) with check (is_admin());

-- 0013: character filter columns
alter table characters add column if not exists gender text not null default 'female';
alter table characters add column if not exists style text not null default 'realistic';
alter table characters add column if not exists age integer not null default 24;

-- 0014: profile ban columns
alter table profiles add column if not exists is_banned boolean not null default false;
alter table profiles add column if not exists banned_reason text;
