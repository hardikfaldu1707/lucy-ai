-- Character config (editable system prompt) + ownership/visibility.
-- created_by null  => admin/seed character (public catalog).
-- created_by set   => user-created character; visibility defaults to 'private'
--                     so it only shows to its creator.

alter table characters add column if not exists system_prompt text;
alter table characters add column if not exists created_by text
  references profiles(id) on delete set null;
alter table characters add column if not exists visibility text not null default 'public';

-- Visibility-aware read policy:
--   * published + public  -> world-readable (home/explore)
--   * own (created_by)     -> creator can always read their own girls
--   * admin                -> reads everything
-- Writes still go through server-side service-role APIs (admin + user create),
-- which bypass RLS, so no broad owner-write policy is added here.
drop policy if exists characters_read_all on characters;
create policy characters_read_all on characters
  for select using (
    (is_published and visibility = 'public')
    or created_by = current_profile_id()
    or is_admin()
  );
