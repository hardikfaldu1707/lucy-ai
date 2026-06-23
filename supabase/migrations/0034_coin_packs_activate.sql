-- Mark seed coin packs as active. Admin must still attach Stripe price IDs
-- via /admin/coin-packs before purchases work (listActiveCoinPacks requires both).

update coin_packs
set is_active = true, updated_at = now()
where slug in ('starter', 'popular', 'mega')
  and is_active = false;
