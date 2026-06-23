-- Coin pack catalog (one-time purchases) + billing record typing

create table coin_packs (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  label           text not null,
  coin_amount     integer not null check (coin_amount > 0),
  price_cents     integer not null check (price_cents > 0),
  currency        text not null default 'usd',
  stripe_price_id text,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  badge           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index coin_packs_active_sort_idx on coin_packs (is_active, sort_order);

alter table billing_records
  add column if not exists record_type text not null default 'subscription',
  add column if not exists metadata jsonb not null default '{}';

alter table billing_records
  add constraint billing_records_record_type_check
  check (record_type in ('subscription', 'coin_pack'));

insert into coin_packs (slug, label, coin_amount, price_cents, sort_order, badge, is_active)
values
  ('starter', 'Starter', 500, 499, 1, null, false),
  ('popular', 'Popular', 2000, 1499, 2, 'Best value', false),
  ('mega', 'Mega', 6000, 3999, 3, null, false)
on conflict (slug) do nothing;
