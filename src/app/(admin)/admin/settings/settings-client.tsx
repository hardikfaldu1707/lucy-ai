"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ToggleLeft,
  Phone,
  Coins,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { FlagState } from "@/lib/data/app-settings";
import type { EconomySettingState } from "@/lib/data/economy-settings";

interface AdminSettingsClientProps {
  initialFlags?: FlagState[];
  initialEconomy?: EconomySettingState[];
}

interface AdminSettingsResponse {
  flags: FlagState[];
  economy: EconomySettingState[];
}

async function fetchSettings(): Promise<AdminSettingsResponse> {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json() as Promise<AdminSettingsResponse>;
}

export function AdminSettingsClient({ initialFlags, initialEconomy }: AdminSettingsClientProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchSettings,
    initialData:
      initialFlags && initialEconomy
        ? { flags: initialFlags, economy: initialEconomy }
        : undefined,
  });
  const flags = data?.flags ?? [];
  const economy = data?.economy ?? [];

  const { data: voiceConfig } = useQuery({
    queryKey: ["voice-config"],
    queryFn: async () => {
      const res = await fetch("/api/voice/config");
      if (!res.ok) return null;
      return res.json() as Promise<{
        enabled: boolean;
        mode: string;
        sessionCost: number;
        sessionSeconds: number;
      }>;
    },
  });

  const patchFlag = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      toast.success("Setting saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchEconomy = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      toast.success("Economy setting saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Admin settings" description="Platform configuration and feature toggles." />

      {/* Feature Flags */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary" />
            <CardTitle>Feature flags</CardTitle>
          </div>
          <CardDescription>Enable or disable platform features in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            flags.map((f) => (
              <div
                key={f.key}
                className="flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{f.label}</Label>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase",
                        f.value
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                      )}
                    >
                      {f.value ? "On" : "Off"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <Switch
                  checked={f.value}
                  disabled={patchFlag.isPending}
                  onCheckedChange={(value) => patchFlag.mutate({ key: f.key, value })}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Voice Calls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle>Voice calls</CardTitle>
          </div>
          <CardDescription>Voice call configuration and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {voiceConfig?.enabled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className="font-medium">Status:</span>
              <span
                className={cn(
                  voiceConfig?.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}
              >
                {voiceConfig?.enabled ? "Ready" : "Not ready"}
              </span>
            </div>
            {voiceConfig && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Mode:</span>
                  <Badge variant="outline" className="text-xs">
                    {voiceConfig.mode === "native" ? "Native audio (gpt-audio)" : "Text (OpenRouter chat + TTS)"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Cost:</span>
                  <span className="tabular-nums">
                    {voiceConfig.sessionCost} coins per call, {voiceConfig.sessionSeconds}s max
                  </span>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Env: <code className="rounded bg-muted px-1 py-0.5 text-[10px]">OPENROUTER_API_KEY</code> +{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">OPENROUTER_VOICE_MODEL</code>. Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">VOICE_DEMO_MODE=true</code> for browser STT
            + chat + TTS.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.publicChat}>Test from chat</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Coin Economy */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle>Coin economy</CardTitle>
          </div>
          <CardDescription>Configure coin costs for platform features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            economy.map((setting) => (
              <EconomySettingRow
                key={`${setting.key}-${setting.value}`}
                setting={setting}
                disabled={patchEconomy.isPending}
                onSave={(value) => patchEconomy.mutate({ key: setting.key, value })}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EconomySettingRow({
  setting,
  disabled,
  onSave,
}: {
  setting: EconomySettingState;
  disabled: boolean;
  onSave: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(setting.value));
  const parsed = Number(draft);
  const isValid = Number.isInteger(parsed) && parsed >= 0;
  const changed = isValid && parsed !== setting.value;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <div className="space-y-1">
        <Label className="font-medium">{setting.label}</Label>
        <p className="text-xs text-muted-foreground">{setting.description}</p>
        <p className="text-[10px] text-muted-foreground">Default: {setting.default}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step={1}
          className="w-20 h-8 text-sm"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          size="sm"
          className="h-8 gap-1"
          disabled={disabled || !changed || !isValid}
          onClick={() => onSave(parsed)}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
