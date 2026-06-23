"use client";

import { useQuery } from "@tanstack/react-query";

export interface AiModelChoice {
  id: string;
  label: string;
  provider: string;
}

interface AiModelsPublicResponse {
  models: AiModelChoice[];
  defaultModel: string;
}

async function fetchUserAiModels(): Promise<AiModelsPublicResponse> {
  const res = await fetch("/api/ai-models");
  if (!res.ok) throw new Error("Failed to load AI models");
  return res.json() as Promise<AiModelsPublicResponse>;
}

export function useUserAiModels() {
  return useQuery({
    queryKey: ["ai-models"],
    queryFn: fetchUserAiModels,
    staleTime: 60_000,
  });
}

interface AdminAiModelsResponse {
  models: {
    id: string;
    name: string;
    provider: string;
    isFree: boolean;
  }[];
  settings: { defaultModel: string };
}

async function fetchAdminAiModels(): Promise<AdminAiModelsResponse> {
  const res = await fetch("/api/admin/ai-models");
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to load AI models");
  }
  return res.json() as Promise<AdminAiModelsResponse>;
}

export function useAdminAiModels() {
  return useQuery({
    queryKey: ["admin", "ai-models"],
    queryFn: fetchAdminAiModels,
    staleTime: 60_000,
    retry: 1,
  });
}
