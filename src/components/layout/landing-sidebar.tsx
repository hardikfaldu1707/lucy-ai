"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Menu,
  MessageCircle,
  Plus,
  PlusCircle,
  UserCircle,
  Crown,
  X,
  Home,
  Star,
  User,
  HelpCircle,
  FileText,
  Shield,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LandingNavIcon } from "@/components/icons/animated-nav-icon";
import { Show, SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTES, signInHrefForCreate } from "@/constants/routes";
import { isImmersiveChatRoute } from "@/lib/chat-route-utils";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import { UserMenu } from "./user-menu";
import { useCoinBalance } from "@/hooks/use-coin-balance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { label: "Profile", icon: UserCircle, href: ROUTES.dashboard, badge: "NEW" },
  { label: "Premium", icon: Crown, href: ROUTES.pricing, badge: "70%" },
];

const SIGNED_IN_NAV_ITEMS: NavItem[] = [
  { label: "Create", icon: Plus, href: ROUTES.create },
  { label: "Explore", icon: Compass, href: ROUTES.explore },
  { label: "Chat", icon: MessageCircle, href: ROUTES.publicChat },
  { label: "Profile", icon: UserCircle, href: ROUTES.dashboard, badge: "NEW" },
  { label: "Premium", icon: Crown, href: ROUTES.pricing, badge: "70%" },
];

const MOBILE_BOTTOM_NAV_ITEMS = [
  { label: "Explore", icon: Home, href: ROUTES.explore },
  { label: "Chat", icon: MessageCircle, href: ROUTES.publicChat },
  { label: "Create", icon: Plus, href: ROUTES.create, isCenter: true },
  { label: "Profile", icon: User, href: ROUTES.dashboard },
  { label: "Premium", icon: Star, href: ROUTES.pricing },
];

function createNavHref(isSignedIn: boolean): string {
  return isSignedIn ? ROUTES.create : signInHrefForCreate();
}

// Custom route active checks to match your original configuration
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
  const { data: balance } = useCoinBalance();
  const displayBalance = isSignedIn ? (balance === undefined ? "…" : balance.toLocaleString()) : "0";

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
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white">
              <span className="tabular-nums">{displayBalance}</span>
              <Link
                href={ROUTES.pricing}
                onClick={onNavigate}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white hover:bg-pink-400"
                aria-label="Get more coins"
              >
                +
              </Link>
            </div>
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
                prefetch
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

  // Desktop rail view
  return (
    <>
      <Link
        href={isSignedIn ? ROUTES.homepage : ROUTES.home}
        className="mb-6 flex flex-col items-center gap-1"
        onClick={onNavigate}
        aria-label="Lucy AI home"
      >
        <LogoMark
          size={42}
          className="transition-transform duration-300 hover:scale-105"
        />
      </Link>

      <div className="mb-6 flex justify-center">
        <Link
          href={ROUTES.pricing}
          onClick={onNavigate}
          className="flex h-8 items-center justify-between gap-2.5 rounded-full border border-white/10 bg-zinc-900/60 pl-3.5 pr-1 py-1 text-xs font-semibold text-white transition-all duration-200 hover:bg-zinc-800/80 hover:border-white/20 active:scale-95"
          aria-label="Coin balance"
        >
          <span className="tabular-nums font-bold tracking-tight text-[11px] min-w-[12px] text-center">{displayBalance}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-xs font-bold text-white shadow-sm shadow-pink-500/20">
            +
          </span>
        </Link>
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-6 py-2" aria-label="Main">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const href = item.label === "Create" ? createNavHref(Boolean(isSignedIn)) : item.href;
          const Icon = item.icon;

          return (
            <div key={item.label} className="w-full flex flex-col items-center animate-fade-in">
              {item.label === "Premium" && (
                <div className="w-8 h-[1px] bg-white/10 mb-6" />
              )}

              <Link
                href={href}
                prefetch
                onClick={onNavigate}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95",
                  active ? "text-pink-400 font-semibold" : "text-white/60 hover:text-white"
                )}
              >
                <div className="relative flex items-center justify-center">
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-5 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none text-white shadow-sm shadow-pink-500/20",
                        item.badge === "NEW" ? "bg-pink-500" : "bg-gradient-to-r from-pink-500 to-fuchsia-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  <LandingNavIcon
                    label={item.label}
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105",
                      active ? "text-pink-400" : "text-white/60 group-hover:text-white"
                    )}
                  />
                </div>

                <span className="text-[11px] font-medium tracking-wide font-sans mt-0.5">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-4 pb-2">
        <Show when="signed-out">
          <div className="flex flex-col items-center gap-3.5">
            <SignInButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
              <button
                type="button"
                onClick={onNavigate}
                className="text-[13px] font-medium text-white/80 hover:text-white transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl={ROUTES.homepage} fallbackRedirectUrl={ROUTES.homepage}>
              <Button
                onClick={onNavigate}
                className="h-8 w-[76px] rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-[10px] font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-200 hover:from-pink-400 hover:to-fuchsia-500 active:scale-95 px-1 tracking-tight uppercase"
              >
                Join Free
              </Button>
            </SignUpButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white/45 hover:text-white transition-colors p-1" aria-label="More menu">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="right" className="w-40 bg-zinc-950 border-white/10 text-white">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.faq} className="cursor-pointer flex items-center gap-2 text-xs">
                    <HelpCircle className="h-3.5 w-3.5" /> FAQ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.contact} className="cursor-pointer flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.terms} className="cursor-pointer flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" /> Terms
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.privacy} className="cursor-pointer flex items-center gap-2 text-xs">
                    <Shield className="h-3.5 w-3.5" /> Privacy
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="flex flex-col items-center gap-3.5">
            <UserMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white/45 hover:text-white transition-colors p-1" aria-label="More menu">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="right" className="w-40 bg-zinc-950 border-white/10 text-white">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.faq} className="cursor-pointer flex items-center gap-2 text-xs">
                    <HelpCircle className="h-3.5 w-3.5" /> FAQ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.contact} className="cursor-pointer flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.terms} className="cursor-pointer flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" /> Terms
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.privacy} className="cursor-pointer flex items-center gap-2 text-xs">
                    <Shield className="h-3.5 w-3.5" /> Privacy
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Show>
      </div>
    </>
  );
}

const CompassDial = ({ active }: { active: boolean }) => {
  return (
    <m.div
      className={cn(
        "relative flex h-[24px] w-[24px] items-center justify-center rounded-full border transition-all duration-300",
        active
          ? "border-pink-500 bg-pink-500/10 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
          : "border-zinc-700 bg-zinc-900/50"
      )}
      animate={active ? { rotate: [0, -15, 10, -5, 0] } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Compass Needle */}
      <div
        className={cn(
          "absolute w-[2px] h-[75%] transition-colors duration-300 rotate-[45deg] bg-gradient-to-b",
          active ? "from-pink-500 to-pink-500/10" : "from-zinc-500 to-zinc-700/10"
        )}
      />
      <span
        className={cn(
          "relative z-10 font-sans text-[10px] font-black tracking-tighter leading-none select-none transition-colors duration-300",
          active ? "text-white" : "text-zinc-400"
        )}
      >
        N
      </span>
    </m.div>
  );
};

export function LandingSidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const {
    landingMobileMenuOpen,
    setLandingMobileMenuOpen,
  } = useUIStore();
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
      {/* Desktop sidebar — always visible, fixed width matching design */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-[92px] flex-col items-center border-r border-white/5 bg-black py-6 md:flex"
        aria-label="Sidebar"
      >
        <SidebarContent collapsed={false} />
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
          className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-around border-t border-white/5 bg-zinc-950/95 backdrop-blur-md px-2 pb-safe pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;

            if (item.isCenter) {
              const createHref = isSignedIn ? ROUTES.create : signInHrefForCreate();
              return (
                <Link
                  key={item.label}
                  href={createHref}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-500/25 transition-transform duration-200"
                  aria-label="Create AI Companion"
                >
                  <m.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="flex items-center justify-center"
                  >
                    <Icon className="h-6 w-6" />
                  </m.div>
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors duration-200",
                  active ? "text-pink-400" : "text-zinc-500 hover:text-white/80"
                )}
              >
                <m.div
                  whileTap={{ scale: 0.85 }}
                  animate={active ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {item.label === "Explore" ? (
                    <CompassDial active={active} />
                  ) : (
                    <Icon className={cn("h-[22px] w-[22px]", active ? "text-pink-400" : "text-zinc-500")} />
                  )}
                </m.div>
                <span className="text-[10px] tracking-wide font-sans">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </TooltipProvider>
  );
}
