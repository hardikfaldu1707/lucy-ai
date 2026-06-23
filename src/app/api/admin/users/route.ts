import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listUsers } from "@/lib/data/admin-users";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const result = await listUsers({ search, page });
  return NextResponse.json(result);
}
