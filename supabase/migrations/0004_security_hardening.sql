-- Lucy AI — security hardening per Supabase database advisors.

-- 1. Reconciliation view should enforce the querying user's RLS, not the
--    creator's (clears the security_definer_view ERROR). Admins still see all
--    rows via the is_admin() policy on coin_balances/coin_ledger.
alter view coin_balance_check set (security_invoker = on);

-- 2. Pin search_path on the RLS helper functions (mutable search_path WARN).
--    Bodies only call schema-qualified auth.jwt() + pg_catalog builtins.
alter function current_profile_id() set search_path = '';
alter function is_admin() set search_path = '';

-- 3. Tighten EXECUTE on SECURITY DEFINER functions exposed via PostgREST.
--    rls_auto_enable runs only from its event trigger (which fires regardless
--    of EXECUTE grants); it should never be callable as an RPC.
revoke all on function rls_auto_enable() from public, anon, authenticated;

--    spend_coins: signed-in users only (debits their own balance).
revoke all on function spend_coins(integer, coin_reason, jsonb, text) from public, anon;
grant execute on function spend_coins(integer, coin_reason, jsonb, text) to authenticated;

--    grant_coins: server-side only. The admin "grant coins" path calls it
--    through the service-role client; the in-body is_admin() check stays as
--    defense-in-depth.
revoke all on function grant_coins(text, integer, coin_reason, jsonb, text) from public, anon, authenticated;
grant execute on function grant_coins(text, integer, coin_reason, jsonb, text) to service_role;
