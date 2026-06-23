-- Hot-path indexes for plan limits, memories, characters, and analytics.

create index if not exists messages_profile_role_created_idx
  on messages (profile_id, role, created_at desc);

create index if not exists memories_profile_character_idx
  on memories (profile_id, character_id);

create index if not exists characters_created_by_idx
  on characters (created_by) where created_by is not null;

create index if not exists characters_catalog_idx
  on characters (is_published, visibility, created_at desc);

create index if not exists ai_usage_log_profile_idx
  on ai_usage_log (profile_id) where profile_id is not null;

create index if not exists reports_reporter_idx
  on reports (reporter_id) where reporter_id is not null;
