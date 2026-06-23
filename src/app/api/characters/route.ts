import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  listAuthenticatedCatalogCharactersLive,
  listHomeCharactersLive,
} from "@/lib/data/characters-public";
import { createCharacter } from "@/lib/data/admin-characters";
import { ensureProfile } from "@/lib/ensure-profile";
import { assertCanCreateCharacter } from "@/lib/plan-limits";
import { getFlagMap } from "@/lib/data/app-settings";
import { isValidUserModel } from "@/lib/ai/validate-model";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { createCharacterSchema } from "@/lib/validation/schemas";
import { buildCharacterSystemPrompt } from "@/lib/characters/build-character-system-prompt";
import { CREATE_VOICE_OPTIONS } from "@/constants/create-voices";

// Public: the home/explore catalog (published + public characters).
export const revalidate = 120;

export async function GET() {
  const { userId } = await auth();
  const characters = userId
    ? await listAuthenticatedCatalogCharactersLive(userId)
    : await listHomeCharactersLive();

  if (userId) {
    return NextResponse.json({ characters });
  }

  return NextResponse.json(
    { characters },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } },
  );
}

// Authenticated user creates their own AI girl. Ownership and privacy are
// enforced server-side: a non-admin can ONLY create a private girl owned by
// themselves — they cannot publish to the public home page.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  await ensureProfile();
  const banned = await bannedResponse();
  if (banned) return banned;

  const charLimit = await assertCanCreateCharacter(userId);
  if (!charLimit.ok) {
    return NextResponse.json({ error: charLimit.error }, { status: 403 });
  }

  const flags = await getFlagMap();
  if (!flags.user_created_characters) {
    return NextResponse.json({ error: "Character creation is disabled" }, { status: 403 });
  }

  const parsed = await parseBody(req, createCharacterSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.aiModel && !(await isValidUserModel(body.aiModel))) {
    return NextResponse.json({ error: "Model not allowed. Pick from admin-approved models." }, { status: 400 });
  }

  if (
    body.voicePersonaId &&
    !CREATE_VOICE_OPTIONS.some((v) => v.id === body.voicePersonaId)
  ) {
    return NextResponse.json({ error: "Invalid voice selection" }, { status: 400 });
  }

  const relationship =
    body.relationship?.trim() ||
    body.tags?.find((t) =>
      ["Girlfriend", "Best friend", "Crush", "Wife", "Roommate", "Mentor", "Secret admirer", "Fling"].includes(t),
    ) ||
    "";

  const systemPrompt = buildCharacterSystemPrompt({
    name: body.name,
    age: body.age ?? 24,
    gender: body.gender ?? "female",
    style: body.style ?? "realistic",
    personality: body.personality ?? [],
    relationship,
    description: body.description,
    appearance: body.appearance,
    voicePersonaId: body.voicePersonaId,
  });

  const { character, error } = await createCharacter({
    name: body.name,
    tagline: body.tagline,
    description: body.description,
    avatarUrl: body.avatarUrl,
    tags: body.tags,
    personality: body.personality,
    aiModel: body.aiModel ?? null,
    systemPrompt,
    gender: body.gender ?? "female",
    style: body.style ?? "realistic",
    age: body.age ?? 24,
    appearance: body.appearance ?? {},
    voiceId: body.voicePersonaId ?? null,
    // Hard-forced: user girls are private to their creator.
    createdBy: userId,
    visibility: "private",
    isPublished: true,
  });

  if (!character) {
    return NextResponse.json(
      { error: error ?? "Failed to create character" },
      { status: 500 },
    );
  }
  return NextResponse.json({ character }, { status: 201 });
}
