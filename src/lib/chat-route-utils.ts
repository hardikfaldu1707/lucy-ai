import { ROUTES } from "@/constants/routes";

/** Active 1:1 chat or voice — hide bottom nav for immersive layout. */
export function isImmersiveChatRoute(pathname: string): boolean {
  if (!pathname.startsWith("/chat")) return false;
  if (pathname === ROUTES.publicChat || pathname === ROUTES.publicChatNew) return false;
  if (pathname.startsWith("/chat/voice")) return true;

  const match = pathname.match(/^\/chat\/([^/]+)$/);
  if (!match) return false;
  return match[1] !== "new";
}
