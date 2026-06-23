"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { FlagState } from "@/lib/data/app-settings";
import type { EconomySettingState } from "@/lib/data/economy-settings";

interface AdminSettingsResponse {
  flags: FlagState[];
  economy: EconomySettingState[];
}

async function fetchSettings(): Promise<AdminSettingsResponse> {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json() as Promise<AdminSettingsResponse>;
}

export function AdminSettingsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchSettings,
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
      <PageHeader title="Admin settings" description="Platform configuration." />
      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            flags.map((f) => (
              <div key={f.key} className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>{f.label}</Label>
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

      <Card>
        <CardHeader>
          <CardTitle>Voice calls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Toggle <strong className="text-foreground">Voice calls (beta)</strong> above to show
            the phone button in chat and enable <code className="text-xs">/chat/voice</code>.
          </p>
          {voiceConfig && (
            <ul className="list-inside list-disc space-y-1">
              <li>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {voiceConfig.enabled ? "Ready" : "Not ready (check flag or OPENROUTER_API_KEY)"}
                </span>
              </li>
              <li>
                Mode:{" "}
                <span className="font-medium text-foreground">
                  {voiceConfig.mode === "native" ? "Native audio (gpt-audio)" : "Text (OpenRouter chat + TTS)"}
                </span>
              </li>
              <li>
                Economy:{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {voiceConfig.sessionCost} coins
                </span>
                per call,{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {voiceConfig.sessionSeconds}s
                </span>
                max (edit in Coin economy below).
              </li>
            </ul>
          )}
          <p>
            Env: <code className="text-xs">OPENROUTER_API_KEY</code> +{" "}
            <code className="text-xs">OPENROUTER_VOICE_MODEL=openai/gpt-audio</code> (default). Set{" "}
            <code className="text-xs">VOICE_DEMO_MODE=true</code> for browser STT + chat + TTS instead.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.publicChat}>Test from chat</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coin economy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label>{setting.label}</Label>
          <p className="text-xs text-muted-foreground">{setting.description}</p>
          <p className="text-xs text-muted-foreground">Default: {setting.default}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step={1}
            className="w-24"
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button
            size="sm"
            disabled={disabled || !changed || !isValid}
            onClick={() => onSave(parsed)}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
