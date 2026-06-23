import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth/admin-role";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ isAdmin: false });
  }
  const isAdmin = await isAdminUser(userId, sessionClaims);
  return NextResponse.json({ isAdmin });
}
