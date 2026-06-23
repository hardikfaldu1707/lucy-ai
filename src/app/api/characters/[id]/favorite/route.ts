import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bannedResponse } from "@/lib/auth/require-not-banned";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const banned = await bannedResponse();
  if (banned) return banned;

  const { id: characterId } = await params;

  const { data: existing } = await supabaseAdmin()
    .from("user_characters")
    .select("is_favorite")
    .eq("profile_id", userId)
    .eq("character_id", characterId)
    .maybeSingle();

  const nextFavorite = !(existing?.is_favorite ?? false);

  if (existing) {
    await supabaseAdmin()
      .from("user_characters")
      .update({ is_favorite: nextFavorite, updated_at: new Date().toISOString() })
      .eq("profile_id", userId)
      .eq("character_id", characterId);
  } else {
    await supabaseAdmin().from("user_characters").insert({
      profile_id: userId,
      character_id: characterId,
      is_favorite: nextFavorite,
      message_count: 0,
    });
  }

  return NextResponse.json({ isFavorite: nextFavorite });
}
