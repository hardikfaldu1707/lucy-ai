-- Tighten messages RLS: conversation must belong to the same profile.

drop policy if exists msg_owner_all on messages;

create policy msg_owner_all on messages
  for all using (
    (
      profile_id = current_profile_id()
      and exists (
        select 1 from conversations c
        where c.id = messages.conversation_id
          and c.profile_id = current_profile_id()
      )
    )
    or is_admin()
  )
  with check (
    profile_id = current_profile_id()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.profile_id = current_profile_id()
    )
  );
