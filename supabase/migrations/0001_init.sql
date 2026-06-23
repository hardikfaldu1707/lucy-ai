-- Lucy AI — initial schema (tables, enums, indexes)
-- Apply via the Supabase MCP server (apply_migration) or the SQL editor.
-- Profiles.id is the Clerk user id (text), matching auth.jwt()->>'sub'.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================ ENUMS ============================
create type subscription_plan   as enum ('free','premium','ultimate');
create type subscription_status as enum ('active','cancelled','past_due','trialing');
create type relationship_status as enum ('stranger','acquaintance','friend','close','partner');
create type message_role        as enum ('user','assistant','system');
create type message_type        as enum ('text','voice','image','system');
create type memory_type         as enum ('personality','relationship','semantic','episodic');
create type billing_status      as enum ('paid','pending','failed');
create type media_type          as enum ('image','video');
-- Ledger reasons: positive amount = credit, negative = debit.
create type coin_reason as enum (
  'subscription_grant','admin_grant','purchase','signup_bonus','refund',
  'spend_text','spend_image','spend_voice','adjustment'
);

-- ============================ PROFILES ============================
-- Mirror of Clerk identity; PK = Clerk "sub".
create table profiles (
  id             text primary key,
  email          text not null,
  username       text,
  avatar_url     text,
  plan           subscription_plan not null default 'free',
  email_verified boolean not null default false,
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index profiles_email_idx on profiles (email);

-- ============================ CHARACTERS (shared catalog) ============================
create table characters (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique,
  name              text not null,
  tagline           text not null default '',
  description       text not null default '',
  avatar_url        text not null,
  gallery_urls      text[] not null default '{}',
  category          text not null default '',
  tags              text[] not null default '{}',
  personality       text[] not null default '{}',
  voice_preview_url text,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index characters_category_idx on characters (category);

-- ============================ USER_CHARACTERS (per-user state) ============================
create table user_characters (
  profile_id          text not null references profiles(id) on delete cascade,
  character_id        uuid not null references characters(id) on delete cascade,
  is_favorite         boolean not null default false,
  relationship_status relationship_status not null default 'stranger',
  message_count       integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (profile_id, character_id)
);
create index user_characters_profile_idx on user_characters (profile_id);

-- ============================ CONVERSATIONS ============================
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  profile_id      text not null references profiles(id) on delete cascade,
  character_id    uuid not null references characters(id) on delete restrict,
  last_message    text,
  last_message_at timestamptz,
  unread_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (profile_id, character_id)
);
create index conversations_profile_lastmsg_idx
  on conversations (profile_id, last_message_at desc);

-- ============================ MESSAGES ============================
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      text not null references profiles(id) on delete cascade,
  role            message_role not null,
  type            message_type not null default 'text',
  content         text not null default '',
  media_url       text,
  duration        integer,
  created_at      timestamptz not null default now()
);
create index messages_conversation_created_idx on messages (conversation_id, created_at);
create index messages_profile_idx on messages (profile_id);

-- ============================ MEMORIES ============================
create table memories (
  id           uuid primary key default gen_random_uuid(),
  profile_id   text not null references profiles(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  type         memory_type not null,
  title        text not null,
  content      text not null default '',
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index memories_profile_idx on memories (profile_id);

-- ============================ USER_SETTINGS (1:1) ============================
create table user_settings (
  profile_id           text primary key references profiles(id) on delete cascade,
  response_length      text not null default 'medium',
  creativity           integer not null default 50,
  privacy_incognito    boolean not null default false,
  privacy_store_memory boolean not null default true,
  notify_email         boolean not null default true,
  notify_push          boolean not null default true,
  notify_marketing     boolean not null default false,
  extra                jsonb not null default '{}',
  updated_at           timestamptz not null default now()
);

-- ============================ SUBSCRIPTIONS (1:1) ============================
create table subscriptions (
  profile_id             text primary key references profiles(id) on delete cascade,
  plan                   subscription_plan not null default 'free',
  status                 subscription_status not null default 'active',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  monthly_coin_allowance integer not null default 0,
  external_ref           text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================ COINS ============================
create table coin_balances (
  profile_id text primary key references profiles(id) on delete cascade,
  balance    integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table coin_ledger (
  id              uuid primary key default gen_random_uuid(),
  profile_id      text not null references profiles(id) on delete cascade,
  amount          integer not null,
  reason          coin_reason not null,
  balance_after   integer not null,
  metadata        jsonb not null default '{}',
  idempotency_key text,
  created_at      timestamptz not null default now(),
  constraint coin_ledger_nonzero check (amount <> 0)
);
create index coin_ledger_profile_created_idx on coin_ledger (profile_id, created_at desc);
create unique index coin_ledger_idem_idx
  on coin_ledger (profile_id, idempotency_key) where idempotency_key is not null;

-- Coin pricing config (cost per action). Seeded with proposed defaults.
create table action_costs (
  action_type text primary key,
  cost        integer not null check (cost >= 0)
);
insert into action_costs (action_type, cost) values
  ('text', 1), ('image', 20), ('voice_minute', 10)
on conflict (action_type) do nothing;

-- ============================ MEDIA (external CDN references) ============================
create table media_assets (
  id           uuid primary key default gen_random_uuid(),
  profile_id   text not null references profiles(id) on delete cascade,
  provider     text not null,
  bucket       text,
  path         text,
  url          text not null,
  type         media_type not null,
  message_id   uuid references messages(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);
create index media_assets_profile_idx on media_assets (profile_id);
create index media_assets_message_idx on media_assets (message_id);

-- ============================ NOTIFICATIONS ============================
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id text not null references profiles(id) on delete cascade,
  title      text not null,
  body       text not null default '',
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_profile_read_idx on notifications (profile_id, read, created_at desc);

-- ============================ BILLING (admin view; populated later) ============================
create table billing_records (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text not null references profiles(id) on delete cascade,
  amount      numeric(12,2) not null,
  currency    text not null default 'usd',
  status      billing_status not null default 'pending',
  invoice_url text,
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index billing_records_profile_idx on billing_records (profile_id);
