"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Menu,
  MessageCircle,
  Plus,
  UserCircle,
  X,
} from "lucide-react";
import { LandingNavIcon } from "@/components/icons/animated-nav-icon";
import { Show, SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs";
import { LogoMark } from "@/components/shared/logo";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTES, signInHrefForCreate } from "@/constants/routes";
import { isImmersiveChatRoute } from "@/lib/chat-route-utils";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
};

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Create", icon: Plus, href: ROUTES.create },
  { label: "Explore", icon: Compass, href: ROUTES.explore },
  { label: "Chat", icon: MessageCircle, href: ROUTES.publicChat },
  { label: "Profile", icon: UserCircle, href: ROUTES.dashboard },
  { label: "Premium", icon: Crown, href: ROUTES.pricing, badge: "70%" },
];

const SIGNED_IN_NAV_ITEMS: NavItem[] = [
  { label: "Create", icon: Plus, href: ROUTES.create },
  { label: "Explore", icon: Compass, href: ROUTES.explore },
  { label: "Chat", icon: MessageCircle, href: ROUTES.publicChat },
  { label: "Profile", icon: UserCircle, href: ROUTES.dashboard },
  { label: "Premium", icon: Crown, href: ROUTES.pricing, badge: "70%" },
];

function createNavHref(isSignedIn: boolean): string {
  return isSignedIn ? ROUTES.create : signInHrefForCreate();
}

function isNavActive(pathname: string, href: string) {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  if (href === ROUTES.publicChat) return pathname.startsWith("/chat");
  return pathname === href;
}

function SidebarContent({
  onNavigate,
  collapsed,
  layout = "rail",
}: {
  onNavigate?: () => void;
  collapsed: boolean;
  layout?: "rail" | "drawer";
}) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const navItems = isSignedIn ? SIGNED_IN_NAV_ITEMS : PUBLIC_NAV_ITEMS;
  const isDrawer = layout === "drawer";

  if (isDrawer) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <Link
            href={ROUTES.home}
            className="flex items-center gap-3"
            onClick={onNavigate}
            aria-label="Lucy AI home"
          >
            <LogoMark size={40} className="shadow-lg shadow-purple-500/30" />
            <span className="text-sm font-semibold text-white">Lucy AI</span>
          </Link>
          {isSignedIn ? (
            <CoinBalanceBadge variant="compact" />
          ) : (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white">
              <span>0</span>
              <Link
                href={ROUTES.pricing}
                onClick={onNavigate}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white hover:bg-pink-400"
                aria-label="Get more coins"
              >
                +
              </Link>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const href = item.label === "Create" ? createNavHref(Boolean(isSignedIn)) : item.href;
            return (
              <Link
                key={item.label}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-pink-500/15 text-pink-400"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-pink-500/20" : "bg-white/5",
                  )}
                >
                  <LandingNavIcon label={item.label} className="h-5 w-5" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-white/10 pt-4">
          <Show when="signed-out">
            <SignInButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
              <button
                type="button"
                onClick={onNavigate}
                className="min-h-11 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
              <Button
                onClick={onNavigate}
                className="h-11 w-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-all duration-200 hover:from-pink-400 hover:to-fuchsia-500 active:scale-98"
              >
                Join Free
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href={ROUTES.dashboard}
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <UserCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              My AI dashboard
            </Link>
            <div className="flex items-center gap-3 px-3 py-1">
              <UserButton />
              <span className="text-sm text-white/60">Account</span>
            </div>
          </Show>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link
        href={isSignedIn ? ROUTES.homepage : ROUTES.home}
        className={cn("mb-3 flex flex-col items-center gap-1", collapsed && "mb-2")}
        onClick={onNavigate}
        aria-label="Lucy AI home"
      >
        <LogoMark
          size={collapsed ? 30 : 36}
          className="shadow-md shadow-purple-500/20"
        />
      </Link>

      {!collapsed && (
        <div className="mb-2">
          {isSignedIn ? (
            <CoinBalanceBadge variant="compact" />
          ) : (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white">
              <span>0</span>
              <Link
                href={ROUTES.pricing}
                onClick={onNavigate}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white hover:bg-pink-400"
                aria-label="Get more coins"
              >
                +
              </Link>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 w-full flex flex-col items-center gap-2.5 py-1" aria-label="Main">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const href = item.label === "Create" ? createNavHref(Boolean(isSignedIn)) : item.href;
          const link = (
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "group flex flex-col items-center gap-0.5 text-[10px] transition-colors",
                active ? "text-pink-400" : "text-white/60 hover:text-white",
                collapsed && "gap-0",
              )}
              aria-label={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  "flex h-8.5 w-8.5 items-center justify-center rounded-xl transition-colors group-hover:bg-white/10",
                  active && "bg-pink-500/15",
                )}
              >
                <LandingNavIcon label={item.label} className="h-4.5 w-4.5" />
              </span>
              {!collapsed && item.label}
            </Link>
          );

          if (collapsed) {
            return (
              <div key={item.label} className="relative flex flex-col items-center">
                {item.badge && (
                  <span className="absolute -top-1 z-10 rounded bg-pink-500 px-1 py-0.5 text-[8px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              </div>
            );
          }

          return (
            <div key={item.label} className="relative flex flex-col items-center">
              {item.badge && (
                <span className="absolute -top-1 z-10 rounded bg-pink-500 px-1 py-0.5 text-[8px] font-bold leading-none text-white">
                  {item.badge}
                </span>
              )}
              {link}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-2 pb-1">
        <Show when="signed-out">
          {!collapsed && (
            <SignInButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
              <button
                type="button"
                onClick={onNavigate}
                className="text-[10px] font-medium text-white/80 hover:text-white"
              >
                Sign in
              </button>
            </SignInButton>
          )}
          <SignUpButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
            <Button
              onClick={onNavigate}
              className={cn(
                "rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-200 hover:from-pink-400 hover:to-fuchsia-500 active:scale-95",
                collapsed ? "h-8 w-8 p-0 flex items-center justify-center" : "my-0.5 h-8 w-[72px] text-[10px] px-1 tracking-tight uppercase"
              )}
              aria-label={collapsed ? "Join free" : undefined}
            >
              {collapsed ? <Plus className="h-4 w-4" /> : "Join Free"}
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          {!collapsed && (
            <Link
              href={ROUTES.dashboard}
              onClick={onNavigate}
              className="text-[10px] font-medium text-white/80 hover:text-white"
            >
              Profile
            </Link>
          )}
          <UserButton />
        </Show>
      </div>
    </>
  );
}

export function LandingSidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const {
    landingNavCollapsed,
    toggleLandingNav,
    landingMobileMenuOpen,
    setLandingMobileMenuOpen,
  } = useUIStore();
  const navItems = isSignedIn ? SIGNED_IN_NAV_ITEMS : PUBLIC_NAV_ITEMS;
  const hideBottomNav =
    isImmersiveChatRoute(pathname) ||
    pathname === ROUTES.create ||
    (pathname.startsWith("/my/") && pathname.endsWith("/edit"));
  const showMobileTopBar = !pathname.startsWith("/chat");

  useEffect(() => {
    setLandingMobileMenuOpen(false);
  }, [pathname, setLandingMobileMenuOpen]);

  useEffect(() => {
    if (!landingMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [landingMobileMenuOpen]);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar — always visible; collapsed = slim icon rail */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col items-center border-r border-white/5 bg-black py-4 transition-[width] duration-300 md:flex",
          landingNavCollapsed ? "w-14 px-1" : "w-[88px] py-6",
        )}
        aria-label="Sidebar"
      >
        <SidebarContent collapsed={landingNavCollapsed} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-3 h-8 w-8 shrink-0 text-white/50 hover:bg-white/10 hover:text-white"
          onClick={toggleLandingNav}
          aria-label={landingNavCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {landingNavCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </aside>

      {/* Mobile top bar */}
      {showMobileTopBar && (
        <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/5 bg-black px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <Link href={ROUTES.home} aria-label="Lucy AI home">
            <LogoMark size={36} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-white hover:bg-white/10"
            onClick={() => setLandingMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Mobile drawer — full navigation panel */}
      {landingMobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/70 md:hidden"
            onClick={() => setLandingMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-[70] flex w-[min(20rem,85vw)] flex-col",
              "border-r border-white/10 bg-black shadow-2xl shadow-black/50 md:hidden",
              "pt-[max(1rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]",
            )}
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="flex shrink-0 justify-end px-3 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-white hover:bg-white/10"
                onClick={() => setLandingMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar px-4 pb-4">
              <SidebarContent
                layout="drawer"
                collapsed={false}
                onNavigate={() => setLandingMobileMenuOpen(false)}
              />
            </div>
          </aside>
        </>
      )}

      {/* Mobile bottom nav — hidden during active 1:1 chat */}
      {!hideBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/5 bg-black px-1 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] max-[360px]:text-[9px]",
                isNavActive(pathname, item.href) ? "text-pink-400" : "text-white/60",
              )}
            >
              <LandingNavIcon label={item.label} className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate max-[360px]:hidden">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </TooltipProvider>
  );
}
