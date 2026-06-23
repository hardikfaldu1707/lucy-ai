// Known platform feature flags surfaced in the admin Settings page. Stored in
// the app_settings table keyed by `key`. These are persisted today; wiring a
// flag into actual app behavior is a separate, per-flag follow-up.

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  default: boolean;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: "voice_calls_beta",
    label: "Voice calls (beta)",
    description: "Show the phone button in chat and enable /chat/voice calls.",
    default: true,
  },
  {
    key: "image_generation",
    label: "Image generation",
    description: "Allow users to generate images in chat.",
    default: false,
  },
  {
    key: "new_signup_flow",
    label: "New signup flow",
    description: "Route new users through the redesigned onboarding.",
    default: false,
  },
  {
    key: "user_created_characters",
    label: "User-created characters",
    description: "Let users create their own private AI girls.",
    default: true,
  },
  {
    key: "coin_pack_purchases",
    label: "Coin pack purchases",
    description: "Allow users to buy one-time coin packs.",
    default: true,
  },
];
