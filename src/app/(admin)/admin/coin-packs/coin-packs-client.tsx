"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type AdminCoinPack = {
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
};

async function fetchPacks(): Promise<AdminCoinPack[]> {
  const res = await fetch("/api/admin/coin-packs");
  if (!res.ok) throw new Error("Failed to load packs");
  const data = (await res.json()) as { packs: AdminCoinPack[] };
  return data.packs;
}

function PackRow({ pack }: { pack: AdminCoinPack }) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(pack.label);
  const [coinAmount, setCoinAmount] = useState(String(pack.coinAmount));
  const [priceCents, setPriceCents] = useState(String(pack.priceCents));
  const [stripePriceId, setStripePriceId] = useState(pack.stripePriceId ?? "");
  const [badge, setBadge] = useState(pack.badge ?? "");
  const [sortOrder, setSortOrder] = useState(String(pack.sortOrder));
  const [isActive, setIsActive] = useState(pack.isActive);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/coin-packs/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          coinAmount: Number(coinAmount),
          priceCents: Number(priceCents),
          stripePriceId: stripePriceId.trim() || null,
          badge: badge.trim() || null,
          sortOrder: Number(sortOrder),
          isActive,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }
    },
    onSuccess: () => {
      toast.success("Pack updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "coin-packs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/coin-packs/${pack.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Pack deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "coin-packs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-1">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          <p className="text-xs text-muted-foreground">slug: {pack.slug}</p>
        </div>
        <div className="space-y-1">
          <Label>Coins</Label>
          <Input value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} type="number" />
        </div>
        <div className="space-y-1">
          <Label>Price (cents)</Label>
          <Input value={priceCents} onChange={(e) => setPriceCents(e.target.value)} type="number" />
        </div>
        <div className="space-y-1">
          <Label>Stripe Price ID</Label>
          <Input value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} placeholder="price_..." />
        </div>
        <div className="space-y-1">
          <Label>Badge</Label>
          <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Best value" />
        </div>
        <div className="space-y-1">
          <Label>Sort order</Label>
          <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} type="number" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id={`active-${pack.id}`} />
          <Label htmlFor={`active-${pack.id}`}>Active</Label>
          {!stripePriceId.trim() && isActive && (
            <Badge variant="destructive">Needs Stripe ID</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
          <Button variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoinPacksAdminClient() {
  const queryClient = useQueryClient();
  const { data: packs = [], isLoading } = useQuery({
    queryKey: ["admin", "coin-packs"],
    queryFn: fetchPacks,
  });

  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCoins, setNewCoins] = useState("500");
  const [newPrice, setNewPrice] = useState("499");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/coin-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug,
          label: newLabel,
          coinAmount: Number(newCoins),
          priceCents: Number(newPrice),
          isActive: false,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Create failed");
      }
    },
    onSuccess: () => {
      toast.success("Pack created");
      setNewSlug("");
      setNewLabel("");
      queryClient.invalidateQueries({ queryKey: ["admin", "coin-packs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coin packs"
        description="Manage one-time coin purchases. Link each pack to a Stripe one-time Price ID, then activate."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4 md:items-end">
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="starter" />
          </div>
          <div className="space-y-1">
            <Label>Label</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Starter" />
          </div>
          <div className="space-y-1">
            <Label>Coins</Label>
            <Input value={newCoins} onChange={(e) => setNewCoins(e.target.value)} type="number" />
          </div>
          <div className="space-y-1">
            <Label>Price (cents)</Label>
            <Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} type="number" />
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !newSlug || !newLabel}>
            Add pack
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          {packs.map((pack) => <PackRow key={pack.id} pack={pack} />)}
        </div>
      )}
    </div>
  );
}
