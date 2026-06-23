"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpenRouterModel } from "@/lib/ai/openrouter";
import type { AiModelSettings } from "@/lib/data/ai-model-settings";

interface AiModelsResponse {
  models: OpenRouterModel[];
  settings: AiModelSettings;
}

interface TestResult {
  ok: boolean;
  model: string;
  reply?: string;
  latencyMs: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number };
  error?: string;
}

async function fetchAiModels(): Promise<AiModelsResponse> {
  const res = await fetch("/api/admin/ai-models");
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to load models");
  }
  return res.json() as Promise<AiModelsResponse>;
}

export function AdminAiModelsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "ai-models"],
    queryFn: fetchAiModels,
  });

  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(true);
  const [draft, setDraft] = useState<{
    selectedAllowed: string[];
    defaultModel: string;
    testModel: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const selectedAllowed =
    draft?.selectedAllowed ?? data?.settings.userAllowedModels ?? [];
  const defaultModel = draft?.defaultModel ?? data?.settings.defaultModel ?? "";
  const testModel = draft?.testModel ?? data?.settings.defaultModel ?? "";

  function patchDraft(
    partial: Partial<{
      selectedAllowed: string[];
      defaultModel: string;
      testModel: string;
    }>,
  ) {
    setDraft((prev) => ({
      selectedAllowed:
        partial.selectedAllowed ??
        prev?.selectedAllowed ??
        data?.settings.userAllowedModels ??
        [],
      defaultModel:
        partial.defaultModel ?? prev?.defaultModel ?? data?.settings.defaultModel ?? "",
      testModel:
        partial.testModel ?? prev?.testModel ?? data?.settings.defaultModel ?? "",
    }));
  }

  const filtered = useMemo(() => {
    const models = data?.models ?? [];
    const q = search.trim().toLowerCase();
    return models.filter((m) => {
      if (freeOnly && !m.isFree) return false;
      if (!q) return true;
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
      );
    });
  }, [data?.models, search, freeOnly]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/ai-models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAllowedModels: selectedAllowed,
          defaultModel,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to save");
      }
    },
    onSuccess: () => {
      toast.success("AI model settings saved");
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "ai-models"] });
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMutation = useMutation({
    mutationFn: async (model: string) => {
      const res = await fetch("/api/admin/ai-models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const json = (await res.json()) as TestResult;
      setTestResult(json);
      if (!json.ok) throw new Error(json.error ?? "Test failed");
      return json;
    },
    onSuccess: () => toast.success("OpenRouter test passed"),
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleAllowed(id: string, checked: boolean) {
    patchDraft({
      selectedAllowed: checked
        ? [...new Set([...selectedAllowed, id])]
        : selectedAllowed.filter((m) => m !== id),
    });
  }

  function selectAllFree() {
    const freeIds = (data?.models ?? []).filter((m) => m.isFree).map((m) => m.id);
    patchDraft({ selectedAllowed: freeIds });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="AI models"
        description="OpenRouter models for AI girls. Choose which models users can pick, set the default, and test the API."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading OpenRouter models…</p>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>User model policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Users can pick one model per AI girl from the allowed list below. Admin-created
                characters can use any OpenRouter model.
              </p>
              <div className="space-y-2">
                <Label htmlFor="defaultModel">Default model for users</Label>
                <Select
                  value={defaultModel}
                  onValueChange={(value) => patchDraft({ defaultModel: value })}
                >
                  <SelectTrigger id="defaultModel">
                    <SelectValue placeholder="Select default" />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.models ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.isFree ? "(free)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllFree}
                >
                  Allow all free models
                </Button>
                <Button
                  size="sm"
                  disabled={saveMutation.isPending || selectedAllowed.length === 0}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? "Saving…" : "Save settings"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedAllowed.length} model(s) allowed for users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test OpenRouter API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1 space-y-2">
                  <Label htmlFor="testModel">Model to test</Label>
                  <Select
                    value={testModel}
                    onValueChange={(value) => patchDraft({ testModel: value })}
                  >
                    <SelectTrigger id="testModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(data?.models ?? [])
                        .filter((m) => m.isFree)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={!testModel || testMutation.isPending}
                  onClick={() => testMutation.mutate(testModel)}
                >
                  {testMutation.isPending ? "Testing…" : "Run test"}
                </Button>
              </div>
              {testResult && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    testResult.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  {testResult.ok ? (
                    <>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Success ({testResult.latencyMs}ms)
                      </p>
                      <p className="mt-1 text-muted-foreground">Reply: {testResult.reply}</p>
                      {testResult.usage && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tokens: {testResult.usage.totalTokens} · Cost: ${testResult.usage.costUsd.toFixed(6)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-destructive">Failed ({testResult.latencyMs}ms)</p>
                      <p className="mt-1 text-muted-foreground">{testResult.error}</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>OpenRouter models ({filtered.length})</CardTitle>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={freeOnly} onCheckedChange={setFreeOnly} />
                  Free only
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-search">Search models</Label>
                <Input
                  id="model-search"
                  placeholder="Search by name, provider, or id…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="max-h-[480px] space-y-2 overflow-y-auto overscroll-y-contain">
                {filtered.map((m) => {
                  const allowed = selectedAllowed.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Switch
                        checked={allowed}
                        onCheckedChange={(v) => toggleAllowed(m.id, v)}
                        aria-label={`Allow ${m.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{m.name}</p>
                          {m.isFree && <Badge variant="secondary">Free</Badge>}
                          <Badge variant="outline">{m.provider}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{m.id}</p>
                        {m.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
