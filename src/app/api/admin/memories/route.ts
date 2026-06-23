import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listMemories } from "@/lib/data/admin-memories";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const page = Number(new URL(req.url).searchParams.get("page") ?? "1") || 1;
  return NextResponse.json(await listMemories(page));
}
