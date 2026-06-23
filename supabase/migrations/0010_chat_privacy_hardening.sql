-- Chat privacy: hard DB-level block so even an admin cannot read chat content.
-- We drop the `or is_admin()` branch from the messages + conversations policies,
-- leaving owner-only access. Admin analytics must use the content-free aggregate
-- function below instead of reading rows directly.

-- messages: owner-only (conversation must also belong to the owner).
drop policy if exists msg_owner_all on messages;
create policy msg_owner_all on messages
  for all using (
    profile_id = current_profile_id()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.profile_id = current_profile_id()
    )
  )
  with check (
    profile_id = current_profile_id()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.profile_id = current_profile_id()
    )
  );

-- conversations: owner-only (drops admin read of last_message preview).
drop policy if exists conv_owner_all on conversations;
create policy conv_owner_all on conversations
  for all using (profile_id = current_profile_id())
  with check (profile_id = current_profile_id());

-- Content-free aggregate for admin analytics: message volume + distinct users
-- per character, with NO message text. security definer so it can read across
-- users, but gated to admins via is_admin() inside the body.
create or replace function admin_message_stats()
returns table (character_id uuid, total_messages bigint, unique_users bigint)
language sql security definer set search_path = public stable as $$
  select c.character_id,
         count(*)::bigint as total_messages,
         count(distinct c.profile_id)::bigint as unique_users
  from messages m
  join conversations c on c.id = m.conversation_id
  where is_admin()
  group by c.character_id;
$$;
