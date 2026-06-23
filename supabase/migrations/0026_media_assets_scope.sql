-- Namespace media_assets by upload scope (user / character / platform).

alter table media_assets add column if not exists scope text not null default 'user';

create index if not exists media_assets_scope_idx on media_assets (scope);
