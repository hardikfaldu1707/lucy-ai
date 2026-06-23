import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Returns true if the current signed-in user is banned. Callers (API routes,
// the dashboard layout) use this to block access. Kept out of edge middleware
// to avoid a DB round-trip on every request.
export async function ensureNotBanned(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const { data } = await createServerSupabase()
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_banned);
}

export async function bannedResponse(): Promise<NextResponse | null> {
  if (await ensureNotBanned()) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }
  return null;
}
