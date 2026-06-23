import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { getCachedOpenRouterModels } from "@/lib/ai/openrouter";
import { isValidAdminModel } from "@/lib/ai/validate-model";
import { getAiModelSettings, setAiModelSettings } from "@/lib/data/ai-model-settings";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [models, settings] = await Promise.all([
      getCachedOpenRouterModels(),
      getAiModelSettings(),
    ]);
    return NextResponse.json({ models, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userAllowedModels?: string[];
    defaultModel?: string;
  };

  const trimmedAllowed = body.userAllowedModels?.map((id) =>
    typeof id === "string" ? id.trim() : "",
  );

  if (trimmedAllowed !== undefined) {
    if (!Array.isArray(body.userAllowedModels)) {
      return NextResponse.json({ error: "userAllowedModels must be an array" }, { status: 400 });
    }
    const invalid = trimmedAllowed.some((id) => !id);
    if (invalid) {
      return NextResponse.json({ error: "Invalid model id in userAllowedModels" }, { status: 400 });
    }
    for (const id of trimmedAllowed) {
      if (!(await isValidAdminModel(id))) {
        return NextResponse.json(
          { error: `Invalid model id in userAllowedModels: "${id}" is not in the OpenRouter catalog` },
          { status: 400 },
        );
      }
    }
  }

  const trimmedDefault =
    typeof body.defaultModel === "string" ? body.defaultModel.trim() : undefined;

  if (trimmedDefault !== undefined) {
    if (!trimmedDefault) {
      return NextResponse.json({ error: "defaultModel must be a non-empty string" }, { status: 400 });
    }
    if (!(await isValidAdminModel(trimmedDefault))) {
      return NextResponse.json(
        { error: `Invalid defaultModel: "${trimmedDefault}" is not in the OpenRouter catalog` },
        { status: 400 },
      );
    }
  }

  try {
    const settings = await setAiModelSettings({
      userAllowedModels: trimmedAllowed,
      defaultModel: trimmedDefault,
    });
    return NextResponse.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
