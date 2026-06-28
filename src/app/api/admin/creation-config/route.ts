import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  getAdminCreationConfig,
  publishCreationConfig,
} from "@/lib/data/character-creation-config";
import type { CreationConfigPublishPayload } from "@/types/character-creation-config";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const config = await getAdminCreationConfig();
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load config" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as CreationConfigPublishPayload | null;
  if (!body?.steps?.length) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    const config = await publishCreationConfig(body);
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish config" },
      { status: 500 },
    );
  }
}
