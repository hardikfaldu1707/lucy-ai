-- User reports / moderation queue.
-- Stores a reference to the reported character/conversation, never chat content
-- (admins cannot read messages — see 0010_chat_privacy_hardening).

create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

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

-- A user can file a report as themselves and read their own;
-- admins read and update everything.
create policy reports_insert_own on reports
  for insert with check (reporter_id = current_profile_id());
create policy reports_select on reports
  for select using (reporter_id = current_profile_id() or is_admin());
create policy reports_admin_update on reports
  for update using (is_admin()) with check (is_admin());
