import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteCharacter, updateCharacter } from "@/lib/data/admin-characters";
import { isValidUserModel } from "@/lib/ai/validate-model";
import { ensureProfile } from "@/lib/ensure-profile";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseBody } from "@/lib/validation/parse";
import { updateUserCharacterSchema } from "@/lib/validation/schemas";
import { buildCharacterSystemPrompt } from "@/lib/characters/build-character-system-prompt";
import { resolveCreateAvatar } from "@/lib/characters/resolve-create-avatar";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";

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

// User updates their own AI girl (name, personality, appearance, etc.).
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

  const parsed = await parseBody(req, updateUserCharacterSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.aiModel !== undefined && body.aiModel !== null) {
    if (!(await isValidUserModel(body.aiModel))) {
      return NextResponse.json(
        { error: "Model not allowed. Pick from admin-approved models." },
        { status: 400 },
      );
    }
  }

  if (body.voicePersonaId !== undefined && body.voicePersonaId !== null) {
    if (!CREATE_VOICE_OPTIONS.some((v) => v.id === body.voicePersonaId)) {
      return NextResponse.json({ error: "Invalid voice selection" }, { status: 400 });
    }
  }

  // Get current character configuration to build the system prompt
  const { data: current, error: getErr } = await supabaseAdmin()
    .from("characters")
    .select("name, age, gender, style, personality, tags, description, appearance, voice_id")
    .eq("id", characterId)
    .single();

  if (getErr || !current) {
    return NextResponse.json({ error: "Character details lookup failed" }, { status: 504 });
  }

  const mergedName = body.name !== undefined ? body.name : current.name;
  const mergedAge = body.age !== undefined ? body.age : current.age;
  const mergedGender = body.gender !== undefined ? body.gender : current.gender;
  const mergedStyle = body.style !== undefined ? body.style : current.style;
  const mergedPersonality = body.personality !== undefined ? body.personality : (current.personality ?? []);
  const mergedTags = body.tags !== undefined ? body.tags : (current.tags ?? []);
  const mergedRelationship = body.relationship !== undefined 
    ? body.relationship 
    : (mergedTags.find((t: string) =>
        ["Girlfriend", "Best friend", "Crush", "Wife", "Roommate", "Mentor", "Secret admirer", "Fling"].includes(t),
      ) ?? "");
  const mergedDescription = body.description !== undefined ? body.description : current.description;
  const mergedAppearance = body.appearance !== undefined ? body.appearance : current.appearance;
  const mergedVoicePersonaId = body.voicePersonaId !== undefined ? body.voicePersonaId : current.voice_id;

  const systemPrompt = buildCharacterSystemPrompt({
    name: mergedName,
    age: mergedAge ?? 24,
    gender: (mergedGender as "female" | "trans") ?? "female",
    style: (mergedStyle as "realistic" | "anime") ?? "realistic",
    personality: mergedPersonality ?? [],
    relationship: mergedRelationship ?? "",
    description: mergedDescription ?? "",
    appearance: mergedAppearance ?? {},
    voicePersonaId: mergedVoicePersonaId ?? undefined,
  });

  const resolvedAvatar =
    body.avatarUrl?.trim() ||
    resolveCreateAvatar({
      style: (mergedStyle as "realistic" | "anime") ?? "realistic",
      appearance: (mergedAppearance ?? {}) as import("@/constants/create-appearance").CharacterAppearance,
    });

  const character = await updateCharacter(characterId, {
    name: mergedName,
    tagline: body.tagline,
    description: mergedDescription,
    ...(resolvedAvatar ? { avatarUrl: resolvedAvatar } : {}),
    tags: mergedTags,
    personality: mergedPersonality,
    aiModel: body.aiModel === undefined ? undefined : body.aiModel,
    systemPrompt: systemPrompt,
    gender: mergedGender,
    style: mergedStyle,
    age: mergedAge,
    appearance: mergedAppearance,
    voiceId: mergedVoicePersonaId === undefined ? undefined : mergedVoicePersonaId,
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
