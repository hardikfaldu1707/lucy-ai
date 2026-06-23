import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { toClerkUsername } from "@/lib/auth/display-name";

/** Sync display name to Clerk (always) and username when Clerk accepts it. */
export async function syncClerkDisplayName(userId: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) return;

  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { displayName: trimmed },
    unsafeMetadata: { displayName: trimmed },
  });

  await client.users.updateUser(userId, {
    firstName: trimmed.slice(0, 255),
  });

  const clerkUsername = toClerkUsername(trimmed);
  if (!clerkUsername) return;

  try {
    await client.users.updateUser(userId, { username: clerkUsername });
  } catch {
    // Username disabled, taken, or rejected — display name is still saved in DB + metadata.
  }
}
