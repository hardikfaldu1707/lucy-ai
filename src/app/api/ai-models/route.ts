import { NextResponse } from "next/server";
import { getAiModelSettings } from "@/lib/data/ai-model-settings";
import { AI_MODELS } from "@/constants/ai-models";

// Public (authenticated or not): models users may pick when creating/editing girls.
export async function GET() {
  const settings = await getAiModelSettings();
  const models = settings.userAllowedModels.map((id) => {
    const known = AI_MODELS.find((m) => m.id === id);
    return {
      id,
      label: known?.label ?? id,
      provider: known?.provider ?? id.split("/")[0] ?? "Other",
    };
  });

  return NextResponse.json({
    models,
    defaultModel: settings.defaultModel,
  });
}
