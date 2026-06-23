import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/track";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const characterSlug = typeof body.characterSlug === "string" ? body.characterSlug : null;

  await supabaseAdmin()
    .from("user_settings")
    .upsert(
      {
        profile_id: userId,
        extra: { onboarding_completed: true, first_character_slug: characterSlug },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );

  await trackEvent("onboarding_completed", userId, { characterSlug });
  return NextResponse.json({ ok: true });
}
