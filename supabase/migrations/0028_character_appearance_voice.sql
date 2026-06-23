-- Appearance presets (ethnicity, hair, body, outfit) + TTS voice for user-created characters.

alter table characters add column if not exists appearance jsonb not null default '{}';
alter table characters add column if not exists voice_id text;
