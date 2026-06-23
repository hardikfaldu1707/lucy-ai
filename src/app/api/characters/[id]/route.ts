import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteCharacter, updateCharacter } from "@/lib/data/admin-characters";
import { isValidUserModel } from "@/lib/ai/validate-model";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOwnedCharacterId(profileId: string, slugOrId: string): Promise<string | null> {
  const key = UUID_RE.test(slugOrId) ? "id" : "slug";
  const { data } = await supabaseAdmin()
    .from("characters")
    .select("id")
    .eq(key, slugOrId)
    .eq("created_by", profileId)
    .maybeSingle();
  return data?.id ?? null;
}

// User updates their own AI girl (model change, etc.).
export async function PATCH(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await context.params;
  const characterId = await getOwnedCharacterId(userId, id);
  if (!characterId) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { aiModel?: string | null };

  if (body.aiModel !== undefined && body.aiModel !== null) {
    if (!(await isValidUserModel(body.aiModel))) {
      return NextResponse.json(
        { error: "Model not allowed. Pick from admin-approved models." },
        { status: 400 },
      );
    }
  }

  const character = await updateCharacter(characterId, {
    aiModel: body.aiModel === undefined ? undefined : body.aiModel,
  });

  if (!character) {
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }

  return NextResponse.json({ character });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const { id } = await context.params;
  const characterId = await getOwnedCharacterId(userId, id);
  if (!characterId) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const result = await deleteCharacter(characterId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
