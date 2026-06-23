import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CoinPack {
  id: string;
  slug: string;
  label: string;
  coinAmount: number;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  badge: string | null;
}

type CoinPackRow = {
  id: string;
  slug: string;
  label: string;
  coin_amount: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  badge: string | null;
};

function fromRow(r: CoinPackRow): CoinPack {
  return {
    id: r.id,
    slug: r.slug,
    label: r.label,
    coinAmount: r.coin_amount,
    priceCents: r.price_cents,
    currency: r.currency,
    stripePriceId: r.stripe_price_id,
    isActive: r.is_active,
    sortOrder: r.sort_order,
    badge: r.badge,
  };
}

export async function listActiveCoinPacks(): Promise<CoinPack[]> {
  const { data, error } = await supabaseAdmin()
    .from("coin_packs")
    .select("*")
    .eq("is_active", true)
    .not("stripe_price_id", "is", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[listActiveCoinPacks]", error.message);
    return [];
  }
  return ((data ?? []) as CoinPackRow[]).map(fromRow);
}

export async function getCoinPackById(id: string): Promise<CoinPack | null> {
  const { data, error } = await supabaseAdmin()
    .from("coin_packs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return fromRow(data as CoinPackRow);
}

export async function listAllCoinPacks(): Promise<CoinPack[]> {
  const { data, error } = await supabaseAdmin()
    .from("coin_packs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[listAllCoinPacks]", error.message);
    return [];
  }
  return ((data ?? []) as CoinPackRow[]).map(fromRow);
}

export type CoinPackInput = {
  slug: string;
  label: string;
  coinAmount: number;
  priceCents: number;
  currency?: string;
  stripePriceId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  badge?: string | null;
};

export async function createCoinPack(input: CoinPackInput): Promise<CoinPack | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("coin_packs")
    .insert({
      slug: input.slug.trim().toLowerCase(),
      label: input.label.trim(),
      coin_amount: input.coinAmount,
      price_cents: input.priceCents,
      currency: input.currency ?? "usd",
      stripe_price_id: input.stripePriceId ?? null,
      is_active: input.isActive ?? false,
      sort_order: input.sortOrder ?? 0,
      badge: input.badge?.trim() || null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createCoinPack]", error.message);
    return null;
  }
  return fromRow(data as CoinPackRow);
}

export async function updateCoinPack(
  id: string,
  patch: Partial<CoinPackInput>,
): Promise<CoinPack | null> {
  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.slug !== undefined) fields.slug = patch.slug.trim().toLowerCase();
  if (patch.label !== undefined) fields.label = patch.label.trim();
  if (patch.coinAmount !== undefined) fields.coin_amount = patch.coinAmount;
  if (patch.priceCents !== undefined) fields.price_cents = patch.priceCents;
  if (patch.currency !== undefined) fields.currency = patch.currency;
  if (patch.stripePriceId !== undefined) fields.stripe_price_id = patch.stripePriceId;
  if (patch.isActive !== undefined) fields.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) fields.sort_order = patch.sortOrder;
  if (patch.badge !== undefined) fields.badge = patch.badge?.trim() || null;

  const { data, error } = await supabaseAdmin()
    .from("coin_packs")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateCoinPack]", error.message);
    return null;
  }
  return fromRow(data as CoinPackRow);
}

export async function deleteCoinPack(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("coin_packs").delete().eq("id", id);
  if (error) {
    console.error("[deleteCoinPack]", error.message);
    return false;
  }
  return true;
}
