import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listAdminMedia, type MediaScope } from "@/lib/data/admin-media";

export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const scope = url.searchParams.get("scope") as MediaScope | null;
  const type = url.searchParams.get("type") as "image" | "video" | null;
  const search = url.searchParams.get("search") ?? undefined;

  const result = await listAdminMedia({
    page,
    scope: scope ?? undefined,
    type: type ?? undefined,
    search,
  });

  return NextResponse.json(result);
}
