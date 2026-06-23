import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/analytics/track";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.p256dh === "string" ? body.p256dh : "";
  const authKey = typeof body.auth === "string" ? body.auth : "";

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await supabaseAdmin().from("push_subscriptions").upsert(
    {
      profile_id: userId,
      endpoint,
      p256dh,
      auth: authKey,
    },
    { onConflict: "profile_id,endpoint" },
  );

  await trackEvent("push_subscribed", userId);
  return NextResponse.json({ ok: true });
}
