-- Configurable character creation wizard (steps + options).

create table if not exists character_creation_steps (
  id           uuid primary key default gen_random_uuid(),
  step_key     text not null unique,
  label        text not null,
  description  text,
  step_type    text not null check (
    step_type in ('single_select', 'dual_select', 'identity', 'multi_select', 'voice', 'review')
  ),
  sort_order   int not null default 0,
  is_enabled   boolean not null default true,
  is_required  boolean not null default true,
  config       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists character_creation_options (
  id            uuid primary key default gen_random_uuid(),
  step_id       uuid not null references character_creation_steps(id) on delete cascade,
  option_key    text not null,
  option_group  text,
  label         text not null,
  image_url     text,
  sort_order    int not null default 0,
  is_enabled    boolean not null default true,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (step_id, option_key, option_group)
);

create index if not exists character_creation_steps_sort_idx
  on character_creation_steps (sort_order);

create index if not exists character_creation_options_step_sort_idx
  on character_creation_options (step_id, sort_order);

alter table character_creation_steps enable row level security;
alter table character_creation_options enable row level security;

create policy character_creation_steps_read on character_creation_steps
  for select using (true);

create policy character_creation_steps_admin on character_creation_steps
  for all using (is_admin()) with check (is_admin());

create policy character_creation_options_read on character_creation_options
  for select using (true);

create policy character_creation_options_admin on character_creation_options
  for all using (is_admin()) with check (is_admin());
