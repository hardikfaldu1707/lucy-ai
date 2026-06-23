-- Restrict count_user_messages_today to service role only (app calls via supabaseAdmin).

revoke all on function count_user_messages_today(text) from public;
revoke all on function count_user_messages_today(text) from authenticated;
grant execute on function count_user_messages_today(text) to service_role;

-- push_subscriptions upsert needs UPDATE policy for RLS clients
drop policy if exists push_subscriptions_update_own on push_subscriptions;
create policy push_subscriptions_update_own on push_subscriptions
  for update using (profile_id = current_profile_id())
  with check (profile_id = current_profile_id());
