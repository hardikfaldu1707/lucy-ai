"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUserDetail } from "@/lib/data/admin-users";

const PLANS = ["free", "premium", "ultimate"] as const;

async function fetchDetail(id: string): Promise<AdminUserDetail> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

export function UserDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [coinAmount, setCoinAmount] = useState("");
  const [banReason, setBanReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchDetail(id),
  });

  const patch = useMutation({
    mutationFn: async (body: {
      plan?: string;
      grantCoins?: number;
      ban?: { reason: string };
      unban?: boolean;
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      toast.success("Updated");
      setCoinAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin", "user", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <PageHeader title="User" description="Loading…" />
      </div>
    );
  }

  const p = data.profile;

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.username ?? p.email}
        description={p.email}
        action={
          <div className="flex items-center gap-2">
            {p.isBanned && <Badge variant="destructive">Banned</Badge>}
            <Button asChild variant="outline">
              <Link href="/admin/users">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Profile">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="capitalize">{p.plan}</dd>
            <dt className="text-muted-foreground">Coins</dt>
            <dd>{p.coinBalance}</dd>
            <dt className="text-muted-foreground">Email verified</dt>
            <dd>{p.emailVerified ? "Yes" : "No"}</dd>
            <dt className="text-muted-foreground">Admin</dt>
            <dd>{p.isAdmin ? "Yes" : "No"}</dd>
            <dt className="text-muted-foreground">Joined</dt>
            <dd>{new Date(p.createdAt).toLocaleString()}</dd>
          </dl>
        </Section>

        <Section title="Admin actions">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Change plan</span>
              <Select
                key={`plan-${p.plan}`}
                value={p.plan}
                onValueChange={(v) => patch.mutate({ plan: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((pl) => (
                    <SelectItem key={pl} value={pl} className="capitalize">{pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Grant coins</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                />
                <Button
                  className="shrink-0 sm:w-auto"
                  disabled={patch.isPending || !coinAmount}
                  onClick={() => patch.mutate({ grantCoins: Number(coinAmount) })}
                >
                  Grant
                </Button>
              </div>
            </div>
            <div className="space-y-1 border-t pt-3">
              <span className="text-sm text-muted-foreground">
                {p.isBanned ? "Suspended" : "Suspend account"}
              </span>
              {p.isBanned ? (
                <div className="space-y-2">
                  {p.bannedReason && (
                    <p className="text-xs text-muted-foreground">Reason: {p.bannedReason}</p>
                  )}
                  <Button
                    variant="outline"
                    disabled={patch.isPending}
                    onClick={() => patch.mutate({ unban: true })}
                  >
                    Unban
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Reason (optional)"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                  <Button
                    className="shrink-0 sm:w-auto"
                    variant="destructive"
                    disabled={patch.isPending || p.isAdmin}
                    onClick={() => patch.mutate({ ban: { reason: banReason } })}
                  >
                    Ban
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Subscription">
          {data.subscription ? (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{data.subscription.status}</dd>
              <dt className="text-muted-foreground">Period end</dt>
              <dd>{data.subscription.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd).toLocaleDateString() : "—"}</dd>
              <dt className="text-muted-foreground">Monthly coins</dt>
              <dd>{data.subscription.monthlyCoinAllowance}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No subscription.</p>
          )}
        </Section>

        <Section title="Billing">
          {data.billing.length ? (
            <ul className="space-y-1 text-sm">
              {data.billing.map((b, i) => (
                <li key={i} className="flex justify-between">
                  <span>{new Date(b.date).toLocaleDateString()}</span>
                  <span>{b.amount} {b.currency.toUpperCase()}</span>
                  <Badge variant="secondary">{b.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No billing records.</p>
          )}
        </Section>

        <Section title="Coin ledger (recent)">
          {data.coinLedger.length ? (
            <ul className="space-y-1 text-sm">
              {data.coinLedger.map((l, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{l.reason}</span>
                  <span className={l.amount >= 0 ? "text-emerald-500" : "text-destructive"}>
                    {l.amount >= 0 ? "+" : ""}{l.amount}
                  </span>
                  <span>{l.balanceAfter}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No transactions.</p>
          )}
        </Section>

        <Section title="Relationships">
          {data.relationships.length ? (
            <ul className="space-y-1 text-sm">
              {data.relationships.slice(0, 10).map((r) => (
                <li key={r.characterId} className="flex justify-between">
                  <span className="truncate">{r.characterId}</span>
                  <span className="capitalize text-muted-foreground">{r.relationshipStatus}</span>
                  <span>{r.messageCount} msgs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No character relationships.</p>
          )}
        </Section>

        <Section title="Memories">
          {data.memories.length ? (
            <ul className="space-y-1 text-sm">
              {data.memories.slice(0, 10).map((m) => (
                <li key={m.id} className="flex justify-between gap-2">
                  <span className="truncate">{m.title}</span>
                  <Badge variant="outline">{m.type}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No memories.</p>
          )}
        </Section>

        <Section title="Privacy note">
          <p className="text-sm text-muted-foreground">
            Chat messages are private and are never shown here, by design (DB-level block).
          </p>
        </Section>
      </div>
    </div>
  );
}
