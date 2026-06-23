-- Lucy V2 — Stripe billing, tenants, analytics, push, conversation summaries

-- Stripe identifiers on subscriptions (external_ref kept for backwards compat)
alter table subscriptions add column if not exists stripe_customer_id text;
alter table subscriptions add column if not exists stripe_subscription_id text;
create unique index if not exists subscriptions_stripe_customer_idx
  on subscriptions (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists subscriptions_stripe_sub_idx
  on subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;

-- Rolling conversation summary for long-context chat
alter table conversations add column if not exists summary text;

-- White-label tenants
create table if not exists tenants (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  brand_name   text not null,
  logo_url     text,
  primary_color text default '#7c3aed',
  domain       text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table profiles add column if not exists tenant_id uuid references tenants(id) on delete set null;
alter table characters add column if not exists tenant_id uuid references tenants(id) on delete set null;
create index if not exists profiles_tenant_idx on profiles (tenant_id);
create index if not exists characters_tenant_idx on characters (tenant_id);

-- Product analytics (cohorts, funnels)
create table if not exists analytics_events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text references profiles(id) on delete set null,
  event       text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_event_created_idx
  on analytics_events (event, created_at desc);
create index if not exists analytics_events_profile_idx
  on analytics_events (profile_id, created_at desc);

-- Web push subscriptions for re-engagement
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text not null references profiles(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique (profile_id, endpoint)
);

-- Seed default platform tenant
insert into tenants (slug, name, brand_name, primary_color)
values ('lucy', 'Lucy AI', 'Lucy AI', '#7c3aed')
on conflict (slug) do nothing;

-- Daily message count helper (used by plan limits)
create or replace function count_user_messages_today(p_profile_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from messages
  where profile_id = p_profile_id
    and role = 'user'
    and created_at >= date_trunc('day', now() at time zone 'utc');
$$;

revoke all on function count_user_messages_today(text) from public;
grant execute on function count_user_messages_today(text) to authenticated, service_role;

-- Idempotent Stripe invoice recording
alter table billing_records add column if not exists external_ref text;
create unique index if not exists billing_records_external_ref_idx
  on billing_records (external_ref) where external_ref is not null;
