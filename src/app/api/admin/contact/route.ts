import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { listContactSubmissions } from "@/lib/data/contact-submissions";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const submissions = await listContactSubmissions();
  return NextResponse.json({ submissions });
}
