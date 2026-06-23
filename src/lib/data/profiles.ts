import "server-only";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UpdateProfileInput } from "@/lib/validation/schemas";
import type { SubscriptionPlan } from "@/types";

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  plan: SubscriptionPlan;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface ProfileSettings {
  language: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyMarketing: boolean;
}

type ProfileRow = {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  plan: SubscriptionPlan;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
};

type UserSettingsRow = {
  notify_email: boolean;
  notify_push: boolean;
  notify_marketing: boolean;
  extra: Record<string, unknown> | null;
};

function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    email: r.email,
    username: r.username,
    avatarUrl: r.avatar_url,
    plan: r.plan,
    emailVerified: r.email_verified,
    isAdmin: r.is_admin,
    createdAt: r.created_at,
  };
}

function rowToSettings(r: UserSettingsRow): ProfileSettings {
  const extra = r.extra ?? {};
  const language =
    typeof extra.locale === "string" && extra.locale.length > 0 ? extra.locale : "en";
  return {
    language,
    notifyEmail: r.notify_email,
    notifyPush: r.notify_push,
    notifyMarketing: r.notify_marketing,
  };
}

const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  language: "en",
  notifyEmail: true,
  notifyPush: true,
  notifyMarketing: false,
};

// The current user's profile (RLS-scoped). Returns null if not signed in or the
// profile row hasn't been synced yet (call ensureProfile() first if needed).
export async function getProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getProfileById(userId);
}

/** Service-role read — use in API routes after Clerk auth() verifies userId. */
export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function getProfileSettings(): Promise<ProfileSettings> {
  const { userId } = await auth();
  if (!userId) return DEFAULT_PROFILE_SETTINGS;
  return getProfileSettingsById(userId);
}

export async function getProfileSettingsById(profileId: string): Promise<ProfileSettings> {
  const { data, error } = await supabaseAdmin()
    .from("user_settings")
    .select("notify_email, notify_push, notify_marketing, extra")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) return DEFAULT_PROFILE_SETTINGS;
  return rowToSettings(data as UserSettingsRow);
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ profile: Profile; settings: ProfileSettings } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return updateProfileById(userId, input);
}

/** Service-role write scoped to one profile id (API routes after Clerk auth). */
export async function updateProfileById(
  profileId: string,
  input: UpdateProfileInput,
): Promise<{ profile: Profile; settings: ProfileSettings } | null> {
  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  if (input.username !== undefined || input.avatarUrl !== undefined) {
    const profilePatch: {
      username?: string;
      avatar_url?: string;
      updated_at: string;
    } = { updated_at: now };
    if (input.username !== undefined) profilePatch.username = input.username;
    if (input.avatarUrl !== undefined) profilePatch.avatar_url = input.avatarUrl;

    const { error } = await admin.from("profiles").update(profilePatch).eq("id", profileId);
    if (error) {
      console.error("[updateProfileById] profiles update failed", error.message);
      return null;
    }
  }

  const hasSettingsUpdate =
    input.language !== undefined ||
    input.notifyEmail !== undefined ||
    input.notifyPush !== undefined ||
    input.notifyMarketing !== undefined;

  if (hasSettingsUpdate) {
    const { data: existing } = await admin
      .from("user_settings")
      .select("extra")
      .eq("profile_id", profileId)
      .maybeSingle();

    const extra = { ...((existing?.extra as Record<string, unknown>) ?? {}) };
    if (input.language !== undefined) extra.locale = input.language;

    const settingsRow: {
      profile_id: string;
      notify_email?: boolean;
      notify_push?: boolean;
      notify_marketing?: boolean;
      extra: Record<string, unknown>;
      updated_at: string;
    } = {
      profile_id: profileId,
      extra,
      updated_at: now,
    };
    if (input.notifyEmail !== undefined) settingsRow.notify_email = input.notifyEmail;
    if (input.notifyPush !== undefined) settingsRow.notify_push = input.notifyPush;
    if (input.notifyMarketing !== undefined) settingsRow.notify_marketing = input.notifyMarketing;

    const { error } = await admin
      .from("user_settings")
      .upsert(settingsRow, { onConflict: "profile_id" });
    if (error) {
      console.error("[updateProfileById] user_settings upsert failed", error.message);
      return null;
    }
  }

  const profile = await getProfileById(profileId);
  if (!profile) return null;
  const settings = await getProfileSettingsById(profileId);
  return { profile, settings };
}
