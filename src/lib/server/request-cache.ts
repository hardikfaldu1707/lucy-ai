import "server-only";

import { cache } from "react";
import { getBalanceForProfile } from "@/lib/data/coins";
import { getFlagMap } from "@/lib/data/app-settings";
import { ensureProfile, type EnsureProfileOptions } from "@/lib/ensure-profile";

/** Dedupe hot-path server work within a single RSC request. */
export const cachedEnsureProfile = cache((options?: EnsureProfileOptions) =>
  ensureProfile(options),
);

export const cachedGetBalanceForProfile = cache((profileId: string) =>
  getBalanceForProfile(profileId),
);

export const cachedGetFlagMap = cache(() => getFlagMap());
