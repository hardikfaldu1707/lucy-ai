import type { ProfileSettings } from "@/lib/data/profiles";

export const PROFILE_QUERY_KEY = ["profile"] as const;

export type ProfileQueryData = {
  profile: {
    id: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    plan: string;
    emailVerified: boolean;
    isAdmin: boolean;
    createdAt: string;
  };
  settings: ProfileSettings;
};

export async function fetchProfile(): Promise<ProfileQueryData> {
  const res = await fetch("/api/profile", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to load profile");
  }
  return res.json() as Promise<ProfileQueryData>;
}

export function applyProfile(
  queryClient: {
    setQueryData: (key: typeof PROFILE_QUERY_KEY, data: ProfileQueryData) => void;
  },
  data: ProfileQueryData,
) {
  queryClient.setQueryData(PROFILE_QUERY_KEY, data);
}
