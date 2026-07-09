import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getProfileById,
  getProfileSettingsById,
  updateProfileById,
} from "@/lib/data/profiles";
import { bannedResponse } from "@/lib/auth/require-not-banned";
import { syncClerkDisplayName } from "@/lib/auth/sync-clerk-profile";
import { ensureProfile } from "@/lib/ensure-profile";
import { checkUserRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { updateProfileSchema } from "@/lib/validation/schemas";

function isClerkAvatarUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "img.clerk.com" || host.endsWith(".clerk.com");
  } catch {
    return false;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const [profile, settings] = await Promise.all([
    getProfileById(userId),
    getProfileSettingsById(userId),
  ]);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile, settings });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateBlocked = await checkUserRateLimit(userId);
  if (rateBlocked) return rateBlocked;

  const banned = await bannedResponse();
  if (banned) return banned;

  const parsed = await parseBody(req, updateProfileSchema);
  if (!parsed.ok) return parsed.response;

  await ensureProfile({ skipAllowance: true });

  const result = await updateProfileById(userId, parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  if (parsed.data.username !== undefined || parsed.data.avatarUrl !== undefined) {
    try {
      if (parsed.data.username !== undefined) {
        await syncClerkDisplayName(userId, parsed.data.username);
      }
      if (parsed.data.avatarUrl !== undefined && !isClerkAvatarUrl(parsed.data.avatarUrl)) {
        const client = await clerkClient();
        const imgRes = await fetch(parsed.data.avatarUrl);
        if (!imgRes.ok) {
          console.error("[profile] failed to fetch avatar for Clerk sync", imgRes.status);
        } else {
          const blob = await imgRes.blob();
          await client.users.updateUserProfileImage(userId, { file: blob });
        }
      }
    } catch (err) {
      console.error("[profile] Clerk sync failed after DB update", err);
    }
  }

  return NextResponse.json(result);
}
