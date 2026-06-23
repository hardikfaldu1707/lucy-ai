-- Voice call sessions: 10 coins upfront, 2-minute window, transcript storage.

create table if not exists voice_call_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references profiles(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  coins_charged integer not null default 10,
  status text not null default 'active',
  transcript_json jsonb not null default '[]'
);

create index if not exists voice_sessions_profile_idx on voice_call_sessions (profile_id);
create index if not exists voice_sessions_active_idx on voice_call_sessions (profile_id, status);

alter table voice_call_sessions enable row level security;

create policy voice_sessions_owner_read on voice_call_sessions
  for select using (profile_id = current_profile_id());
