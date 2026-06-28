"use client";

import { useQuery } from "@tanstack/react-query";
import { buildDefaultCreationConfigPayload } from "@/lib/characters/creation-config-defaults";
import { configFromPublishPayload } from "@/lib/characters/creation-config-utils";
import type { CreationConfig } from "@/types/character-creation-config";

async function fetchCreationConfig(): Promise<CreationConfig> {
  const res = await fetch("/api/creation-config");
  if (res.ok) {
    const json = (await res.json()) as { config: CreationConfig };
    if (json.config?.steps?.length) return json.config;
  }
  return configFromPublishPayload(buildDefaultCreationConfigPayload());
}

export function useCreationConfig() {
  return useQuery({
    queryKey: ["creation-config"],
    queryFn: fetchCreationConfig,
    staleTime: 120_000,
  });
}
