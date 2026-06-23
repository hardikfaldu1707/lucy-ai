import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { deleteAdminMedia } from "@/lib/data/admin-media";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const ok = await deleteAdminMedia(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
