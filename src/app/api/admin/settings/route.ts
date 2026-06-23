import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { getFlags, setFlag } from "@/lib/data/app-settings";
import { getEconomySettings, setEconomySetting } from "@/lib/data/economy-settings";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [flags, economy] = await Promise.all([getFlags(), getEconomySettings()]);
  return NextResponse.json({ flags, economy });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    value?: boolean | number;
  };
  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }

  if (typeof body.value === "boolean") {
    const ok = await setFlag(body.key, body.value);
    if (!ok) return NextResponse.json({ error: "Unknown flag" }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (typeof body.value === "number") {
    const ok = await setEconomySetting(body.key, body.value);
    if (!ok) {
      return NextResponse.json({ error: "Unknown or invalid economy setting" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "value must be boolean or number" }, { status: 400 });
}
