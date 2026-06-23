-- X-style profile: cover banner + chat starter chips
alter table characters
  add column if not exists cover_url text,
  add column if not exists suggested_questions text[] not null default '{}';
