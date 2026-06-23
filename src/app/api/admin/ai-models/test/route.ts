import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { testOpenRouterModel } from "@/lib/ai/openrouter";

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { model?: string };
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model) {
    return NextResponse.json({ error: "model is required" }, { status: 400 });
  }

  const result = await testOpenRouterModel(model);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
