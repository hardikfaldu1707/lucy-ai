import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { createCreationStep } from "@/lib/data/character-creation-config";
import type { CreationStepInput, CreationStepType } from "@/types/character-creation-config";

const STEP_TYPES: CreationStepType[] = [
  "single_select",
  "dual_select",
  "identity",
  "multi_select",
  "voice",
  "review",
];

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<CreationStepInput>;
  if (!body.stepKey?.trim() || !body.label?.trim() || !body.stepType) {
    return NextResponse.json({ error: "stepKey, label, and stepType required" }, { status: 400 });
  }
  if (!STEP_TYPES.includes(body.stepType)) {
    return NextResponse.json({ error: "Invalid stepType" }, { status: 400 });
  }
  const step = await createCreationStep({
    stepKey: body.stepKey.trim(),
    label: body.label.trim(),
    description: body.description,
    stepType: body.stepType,
    sortOrder: body.sortOrder,
    isEnabled: body.isEnabled,
    isRequired: body.isRequired,
    config: body.config,
  });
  if (!step) {
    return NextResponse.json({ error: "Failed to create step" }, { status: 500 });
  }
  return NextResponse.json({ step }, { status: 201 });
}
