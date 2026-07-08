import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listConversations } from "@/lib/data/chat";
import { ensureProfile } from "@/lib/ensure-profile";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Fire profile check and conversations query in parallel.
  const [profileResult, conversations] = await Promise.all([
    supabaseAdmin()
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .maybeSingle(),
    listConversations(userId),
  ]);

  const profile = profileResult.data;
  if (profile?.is_banned) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  // If no profile row exists yet, seed it. Profile existence is cached for 5 min.
  if (!profile) {
    await ensureProfile({ skipAllowance: true });
  }

  return NextResponse.json({ conversations });
}
