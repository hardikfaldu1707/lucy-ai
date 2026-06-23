-- Admin private catalog: visible to any signed-in user (not guests).
-- User-created private characters remain owner-only.

drop policy if exists characters_read_all on characters;
create policy characters_read_all on characters
  for select using (
    (is_published and visibility = 'public')
    or (is_published and visibility = 'private' and created_by is null and current_profile_id() is not null)
    or created_by = current_profile_id()
  );
