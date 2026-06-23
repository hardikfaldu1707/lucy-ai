-- Security observability: a tamper-resistant audit trail for security-relevant
-- events (moderation hits, prompt-injection / jailbreak attempts, blocked output
-- leaks, failed admin checks, rate-limit / auth failures, abuse auto-suspends).
--
-- Mirrors the analytics_events access model: rows are written exclusively by the
-- service-role client (server-side logSecurityEvent) and are readable only by
-- admins. No insert/update/delete policy exists for the anon/authenticated roles,
-- so RLS denies all of their writes by default — users can never forge or read
-- their own security log.

create table if not exists security_events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text references profiles(id) on delete set null,
  ip          text,
  event_type  text not null,
  severity    text not null default 'warning',  -- info | warning | critical
  route       text,
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists security_events_type_created_idx
  on security_events (event_type, created_at desc);
create index if not exists security_events_profile_created_idx
  on security_events (profile_id, created_at desc);
create index if not exists security_events_severity_created_idx
  on security_events (severity, created_at desc);

alter table security_events enable row level security;

-- Admin read-only. Writes happen via the service-role client (RLS-bypassing),
-- so no insert policy is granted to anon/authenticated — denied by default.
drop policy if exists security_events_admin_read on security_events;
create policy security_events_admin_read on security_events
  for select using (is_admin());
