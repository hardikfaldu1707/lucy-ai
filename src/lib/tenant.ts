import "server-only";

import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  domain: string | null;
}

const DEFAULT_TENANT: TenantConfig = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: "lucy",
  name: "Lucy AI",
  brandName: "Lucy AI",
  logoUrl: null,
  primaryColor: "#7c3aed",
  domain: null,
};

type TenantDbRow = {
  id: string;
  slug: string;
  name: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string | null;
  domain: string | null;
};

function tenantFromRow(row: TenantDbRow): TenantConfig {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName: row.brand_name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color ?? "#7c3aed",
    domain: row.domain,
  };
}

async function loadTenantBySlug(slug: string): Promise<TenantConfig | null> {
  const { data } = await supabaseAdmin()
    .from("tenants")
    .select("id, slug, name, brand_name, logo_url, primary_color, domain")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data ? tenantFromRow(data as TenantDbRow) : null;
}

async function loadTenantByDomain(host: string): Promise<TenantConfig | null> {
  const { data } = await supabaseAdmin()
    .from("tenants")
    .select("id, slug, name, brand_name, logo_url, primary_color, domain")
    .eq("domain", host)
    .eq("is_active", true)
    .maybeSingle();

  return data ? tenantFromRow(data as TenantDbRow) : null;
}

function getCachedTenantBySlug(slug: string) {
  return unstable_cache(async () => loadTenantBySlug(slug), [`tenant-slug-${slug}`], {
    revalidate: 300,
    tags: ["tenant-config"],
  })();
}

function getCachedTenantByDomain(host: string) {
  return unstable_cache(async () => loadTenantByDomain(host), [`tenant-domain-${host}`], {
    revalidate: 300,
    tags: ["tenant-config"],
  })();
}

export async function resolveTenant(): Promise<TenantConfig> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_TENANT;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const slugHeader = h.get("x-tenant-slug");
  const envSlug = process.env.TENANT_SLUG;

  const slug = slugHeader ?? envSlug ?? "lucy";

  const bySlug = await getCachedTenantBySlug(slug);
  if (bySlug) return bySlug;

  if (host && host !== "localhost:3000") {
    const byDomain = await getCachedTenantByDomain(host);
    if (byDomain) return byDomain;
  }

  return DEFAULT_TENANT;
}
