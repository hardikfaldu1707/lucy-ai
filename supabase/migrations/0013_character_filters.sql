-- Home/explore filter attributes on characters so the gallery filters
-- (gender / style / age) are fully DB-driven instead of defaulted in code.
alter table characters add column if not exists gender text not null default 'female';
alter table characters add column if not exists style text not null default 'realistic';
alter table characters add column if not exists age integer not null default 24;
