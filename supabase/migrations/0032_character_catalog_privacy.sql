-- User-created characters are private to their creator; admins manage catalog via service role.

drop policy if exists characters_read_all on characters;
create policy characters_read_all on characters
  for select using (
    (is_published and visibility = 'public')
    or created_by = current_profile_id()
  );

-- Per-character usage aggregates: catalog characters only (exclude user-owned).
create or replace function admin_ai_usage_by_character()
returns table (character_id uuid, replies bigint, total_tokens bigint, cost_usd numeric)
language sql security definer set search_path = public stable as $$
  select l.character_id,
         count(*)::bigint,
         coalesce(sum(l.total_tokens), 0)::bigint,
         coalesce(sum(l.cost_usd), 0)
  from ai_usage_log l
  inner join characters c on c.id = l.character_id
  where l.character_id is not null
    and c.created_by is null
  group by l.character_id
  order by count(*) desc;
$$;

revoke all on function admin_ai_usage_by_character() from public;
grant execute on function admin_ai_usage_by_character() to service_role;
