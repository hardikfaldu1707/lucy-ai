import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { overview, topCharacters } from "@/lib/data/admin-stats";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [stats, top] = await Promise.all([overview(), topCharacters()]);
  return NextResponse.json({ overview: stats, topCharacters: top });
}
