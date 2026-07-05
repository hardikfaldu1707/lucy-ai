export function characterProfilePath(slug: string): string {
  return `/c/${encodeURIComponent(slug)}`;
}

export const ROUTES = {
  home: "/",
  homepage: "/home",
  features: "/features",
  pricing: "/pricing",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
  contact: "/contact",
  publicChat: "/chat",
  publicChatNew: "/chat/new",
  publicChatWithCharacter: (slug: string) => `/chat/${encodeURIComponent(slug)}`,
  characterProfile: characterProfilePath,
  myGirl: (slug: string) => `/my/${encodeURIComponent(slug)}`,
  myGirlEdit: (slug: string) => `/my/${encodeURIComponent(slug)}/edit`,
  myGirlChat: (slug: string) => `/my/${encodeURIComponent(slug)}/chat`,
  publicVoice: "/chat/voice",
  create: "/create",
  explore: "/explore",
  generate: "/generate",
  login: "/sign-in",
  signup: "/sign-up",
  dashboard: "/dashboard",
  characters: "/dashboard/characters",
  character: characterProfilePath,
  createCharacter: "/create",
  myGirls: "/dashboard/my-girls",
  chat: "/dashboard/chat",
  chatConversation: (id: string) => `/dashboard/chat/${id}`,
  voice: "/dashboard/voice",
  memory: "/dashboard/memory",
  subscription: "/dashboard/subscription",
  subscriptionCoins: "/dashboard/subscription?section=coins",
  subscriptionActivity: "/dashboard/subscription?section=activity",
  profile: "/dashboard/profile",
  settings: "/dashboard/settings",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminCharacters: "/admin/characters",
  adminUsage: "/admin/usage",
  adminCohorts: "/admin/cohorts",
  adminTenants: "/admin/tenants",
  adminSubscriptions: "/admin/subscriptions",
  adminReports: "/admin/reports",
  adminContact: "/admin/contact",
  adminPayments: "/admin/payments",
  adminCoinPacks: "/admin/coin-packs",
  adminMemories: "/admin/memories",
  adminAiModels: "/admin/ai-models",
  adminSettings: "/admin/settings",
  adminStorage: "/admin/storage",
  adminCreateBuilder: "/admin/create-builder",
} as const;

export function signInHrefForCreate(): string {
  const params = new URLSearchParams({ redirect_url: ROUTES.create });
  return `${ROUTES.login}?${params.toString()}`;
}

export function loginForCharacter(characterSlug: string): string {
  const params = new URLSearchParams({ character: characterSlug });
  return `${ROUTES.login}?${params.toString()}`;
}

export function signupForCharacter(characterSlug: string): string {
  const params = new URLSearchParams({ character: characterSlug });
  return `${ROUTES.signup}?${params.toString()}`;
}

export function characterEntryHref(characterSlug: string): string {
  return ROUTES.characterProfile(characterSlug);
}

export function authRedirectUrl(characterSlug?: string | null): string {
  if (characterSlug) return ROUTES.characterProfile(characterSlug);
  return ROUTES.homepage;
}

/** Clerk may pass a path (/dashboard) or full URL (http://192.168.x.x:3000/dashboard). */
export function resolveAuthPageRedirect(
  redirectUrl?: string | null,
  characterSlug?: string | null,
): string {
  const raw = redirectUrl?.trim();
  if (raw) {
    if (raw.startsWith("/")) return raw;
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      // ignore malformed redirect_url
    }
  }
  return authRedirectUrl(characterSlug);
}

export function guestChatRedirectUrl(characterSlug: string): string {
  return ROUTES.publicChatWithCharacter(characterSlug);
}

export function loginForGuestChat(characterSlug: string): string {
  const params = new URLSearchParams({
    character: characterSlug,
    redirect_url: guestChatRedirectUrl(characterSlug),
  });
  return `${ROUTES.login}?${params.toString()}`;
}

export function signupForGuestChat(characterSlug: string): string {
  const params = new URLSearchParams({
    character: characterSlug,
    redirect_url: guestChatRedirectUrl(characterSlug),
  });
  return `${ROUTES.signup}?${params.toString()}`;
}

export const DASHBOARD_NAV = [
  { title: "Home", href: ROUTES.dashboard, icon: "LayoutDashboard" },
  { title: "My girls", href: ROUTES.myGirls, icon: "Sparkles" },
  { title: "Chat", href: ROUTES.chat, icon: "MessageCircle" },
  { title: "Voice", href: ROUTES.voice, icon: "Phone" },
  { title: "Memory", href: ROUTES.memory, icon: "Brain" },
  { title: "Subscription", href: ROUTES.subscription, icon: "CreditCard" },
  { title: "Profile", href: ROUTES.profile, icon: "User" },
  { title: "Settings", href: ROUTES.settings, icon: "Settings" },
] as const;

export const ADMIN_NAV = [
  { title: "Dashboard", href: ROUTES.admin, icon: "LayoutDashboard" },
  { title: "Users", href: ROUTES.adminUsers, icon: "Users" },
  { title: "Characters", href: ROUTES.adminCharacters, icon: "Sparkles" },
  { title: "Create Builder", href: ROUTES.adminCreateBuilder, icon: "Wand2" },
  { title: "Usage & cost", href: ROUTES.adminUsage, icon: "BarChart3" },
  { title: "Cohorts", href: ROUTES.adminCohorts, icon: "TrendingUp" },
  { title: "Tenants", href: ROUTES.adminTenants, icon: "Building2" },
  { title: "Subscriptions", href: ROUTES.adminSubscriptions, icon: "CreditCard" },
  { title: "Reports", href: ROUTES.adminReports, icon: "Flag" },
  { title: "Contact", href: ROUTES.adminContact, icon: "Mail" },
  { title: "Payments", href: ROUTES.adminPayments, icon: "Wallet" },
  { title: "Coin packs", href: ROUTES.adminCoinPacks, icon: "Coins" },
  { title: "Memories", href: ROUTES.adminMemories, icon: "Brain" },
  { title: "AI models", href: ROUTES.adminAiModels, icon: "Cpu" },
  { title: "Settings", href: ROUTES.adminSettings, icon: "Settings" },
  { title: "Storage", href: ROUTES.adminStorage, icon: "HardDrive" },
] as const;
