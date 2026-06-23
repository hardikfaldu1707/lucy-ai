import "server-only";

import { isAllowedUserModel } from "@/lib/data/ai-model-settings";
import { getCachedOpenRouterModels } from "@/lib/ai/openrouter";

export async function isValidAdminModel(modelId: string): Promise<boolean> {
  const id = modelId.trim();
  if (!id) return false;
  try {
    const models = await getCachedOpenRouterModels();
    const ids = new Set(models.map((m) => m.id));
    return ids.has(id);
  } catch {
    return false;
  }
}

export async function isValidUserModel(modelId: string): Promise<boolean> {
  return isAllowedUserModel(modelId);
}
