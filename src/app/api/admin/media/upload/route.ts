import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { presignUpload, isR2Configured } from "@/lib/storage/r2";
import { buildUploadKey } from "@/lib/storage/upload-keys";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseBody } from "@/lib/validation/parse";
import { uploadMetaSchema } from "@/lib/validation/schemas";

const platformUploadSchema = uploadMetaSchema.extend({
  scope: z.literal("platform"),
  platformName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(80),
});

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 storage is not configured" }, { status: 503 });
  }

  const parsed = await parseBody(req, platformUploadSchema);
  if (!parsed.ok) return parsed.response;

  const { contentType, size, platformName } = parsed.data;
  const key = buildUploadKey({
    scope: "platform",
    profileId: userId,
    contentType,
    platformName,
  });

  const { uploadUrl, publicUrl } = await presignUpload(key, contentType);

  await supabaseAdmin()
    .from("media_assets")
    .insert({
      profile_id: userId,
      provider: "r2",
      bucket: process.env.R2_BUCKET ?? null,
      path: key,
      url: publicUrl,
      type: contentType.startsWith("video/") ? "video" : "image",
      size_bytes: size,
      scope: "platform",
    });

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
