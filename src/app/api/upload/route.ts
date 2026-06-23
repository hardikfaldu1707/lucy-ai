import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  presignUpload,
  isR2Configured,
  putObject,
  publicUrl as r2PublicUrl,
} from "@/lib/storage/r2";
import { buildUploadKey } from "@/lib/storage/upload-keys";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { uploadMetaSchema, mediaScopeSchema } from "@/lib/validation/schemas";
import { resolveImageContentType, resolveVideoContentType } from "@/lib/upload-client";

async function assertScopeAllowed(
  scope: "user" | "character" | "platform",
  platformName?: string,
): Promise<NextResponse | null> {
  if (scope === "platform" || scope === "character") {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (scope === "platform" && !platformName) {
    return NextResponse.json(
      { error: "platformName is required for platform uploads" },
      { status: 400 },
    );
  }
  return null;
}

async function recordMediaAsset(params: {
  userId: string;
  key: string;
  publicUrl: string;
  contentType: string;
  size: number;
  scope: "user" | "character" | "platform";
  characterId?: string;
}) {
  await supabaseAdmin()
    .from("media_assets")
    .insert({
      profile_id: params.userId,
      provider: "r2",
      bucket: process.env.R2_BUCKET ?? null,
      path: params.key,
      url: params.publicUrl,
      type: params.contentType.startsWith("video/") ? "video" : "image",
      character_id: params.characterId ?? null,
      size_bytes: params.size,
      scope: params.scope,
    });
}

// Returns a presigned PUT URL the browser uploads to directly, and records a
// media_assets row (provider 'r2') so admin storage analytics can sum usage.
// Multipart requests upload through this server (avoids R2 CORS/CSP on browser PUT).
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "R2 storage is not configured" },
      { status: 503 },
    );
  }

  const contentTypeHeader = req.headers.get("content-type") ?? "";

  if (contentTypeHeader.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const resolvedContentType =
      resolveImageContentType(file) ?? resolveVideoContentType(file);
    if (!resolvedContentType) {
      return NextResponse.json(
        { error: "Please upload a supported image (JPEG, PNG, WebP, GIF) or video (MP4, WebM)." },
        { status: 400 },
      );
    }

    const isVideo = resolvedContentType.startsWith("video/");
    const maxSize = isVideo ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? "Video too large (max 15MB)" : "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const scopeRaw = String(form.get("scope") ?? "user");
    const scopeParsed = mediaScopeSchema.safeParse(scopeRaw);
    if (!scopeParsed.success) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
    const scope = scopeParsed.data;

    const characterIdRaw = form.get("characterId");
    const characterId =
      typeof characterIdRaw === "string" && characterIdRaw.trim()
        ? characterIdRaw.trim()
        : undefined;

    const platformNameRaw = form.get("platformName");
    const platformName =
      typeof platformNameRaw === "string" && platformNameRaw.trim()
        ? platformNameRaw.trim()
        : undefined;

    const metaParsed = uploadMetaSchema.safeParse({
      contentType: resolvedContentType,
      size: file.size,
      scope,
      characterId,
      platformName,
    });
    if (!metaParsed.success) {
      const msg = metaParsed.error.issues[0]?.message ?? "Invalid upload";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const meta = metaParsed.data;
    const scopeBlocked = await assertScopeAllowed(meta.scope ?? "user", meta.platformName);
    if (scopeBlocked) return scopeBlocked;

    if (isVideo && meta.scope !== "character" && meta.scope !== "platform") {
      return NextResponse.json(
        { error: "Video uploads are only allowed for character or platform scope" },
        { status: 400 },
      );
    }

    const resolvedScope = meta.scope ?? "user";
    const key = buildUploadKey({
      scope: resolvedScope,
      profileId: userId,
      contentType: resolvedContentType,
      characterId: meta.characterId,
      platformName: meta.platformName,
    });

    const body = Buffer.from(await file.arrayBuffer());
    await putObject(key, body, resolvedContentType);
    const url = r2PublicUrl(key);

    await recordMediaAsset({
      userId,
      key,
      publicUrl: url,
      contentType: resolvedContentType,
      size: file.size,
      scope: resolvedScope,
      characterId: meta.characterId,
    });

    return NextResponse.json({ publicUrl: url, key });
  }

  const parsed = await parseBody(req, uploadMetaSchema);
  if (!parsed.ok) return parsed.response;
  const { contentType, size, characterId, scope, platformName } = parsed.data;

  const scopeBlocked = await assertScopeAllowed(scope ?? "user", platformName);
  if (scopeBlocked) return scopeBlocked;

  const resolvedScope = scope ?? "user";

  const key = buildUploadKey({
    scope: resolvedScope,
    profileId: userId,
    contentType,
    characterId,
    platformName,
  });

  const { uploadUrl, publicUrl } = await presignUpload(key, contentType);

  await recordMediaAsset({
    userId,
    key,
    publicUrl,
    contentType,
    size,
    scope: resolvedScope,
    characterId,
  });

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
