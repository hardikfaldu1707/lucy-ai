import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Tenants" };

export default async function AdminTenantsPage() {
  const { data: tenants } = await supabaseAdmin()
    .from("tenants")
    .select("id, slug, name, brand_name, domain, is_active, primary_color")
    .order("created_at");

  return (
    <div className="space-y-8">
      <PageHeader
        title="White-label tenants"
        description="Creator and partner brands running on the Lucy platform."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active tenants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-4 font-medium">Brand</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Domain</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(tenants ?? []).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">
                    <span
                      className="mr-2 inline-block h-3 w-3 rounded-full"
                      style={{ background: t.primary_color ?? "#7c3aed" }}
                    />
                    {t.brand_name}
                  </td>
                  <td className="p-4 font-mono text-xs">{t.slug}</td>
                  <td className="p-4">{t.domain ?? "—"}</td>
                  <td className="p-4">
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
