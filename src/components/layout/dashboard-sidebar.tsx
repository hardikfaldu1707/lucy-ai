"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useProfileDisplayName } from "@/hooks/use-profile-display-name";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DASHBOARD_NAV, ROUTES } from "@/constants/routes";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";
import { memo, useCallback } from "react";

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: { title: string; href: string; icon: string };
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      key={item.href}
      href={item.href}
      prefetch
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-98",
        active
          ? "bg-gradient-to-r from-pink-500/10 to-fuchsia-500/10 text-pink-500 dark:text-pink-400 font-semibold shadow-sm border-l-2 border-pink-500 rounded-l-none pl-2.5"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:translate-x-0.5",
        collapsed && "justify-center px-2 hover:translate-x-0 rounded-xl border-l-0 pl-2"
      )}
      aria-current={active ? "page" : undefined}
    >
      <NavIcon
        name={item.icon}
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
          active ? "text-pink-500 dark:text-pink-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed && (
        <span className="transition-colors duration-200">
          {item.title}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

const MemoizedNavItem = memo(NavItem);

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { displayName } = useProfileDisplayName();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("Failed to clear local storage", e);
    }

    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
        
        const domainParts = window.location.hostname.split(".");
        if (domainParts.length > 2) {
          const rootDomain = domainParts.slice(-2).join(".");
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain};`;
        }
      }
    } catch (e) {
      console.error("Failed to clear cookies", e);
    }

    await signOut({ redirectUrl: ROUTES.home });
  }, [signOut]);

  return (
    <aside
      className={cn(
        "hidden h-full flex-col border-r border-sidebar-border/40 bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground transition-all duration-300 lg:flex",
        sidebarCollapsed ? "w-[76px]" : "w-64"
      )}
      aria-label="Dashboard navigation"
    >
      <div className={cn("flex h-16 items-center px-4", sidebarCollapsed && "justify-center px-2")}>
        <Logo showText={!sidebarCollapsed} />
      </div>
      
      <Separator className="bg-sidebar-border/30" />

      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto no-scrollbar">
          {DASHBOARD_NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <MemoizedNavItem
                key={item.href}
                item={item}
                active={active}
                collapsed={sidebarCollapsed}
              />
            );
          })}
        </nav>
      </TooltipProvider>

      <div className="mt-auto border-t border-sidebar-border/30 p-3 space-y-3">
        {/* Coin Balance */}
        {sidebarCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <CoinBalanceBadge
                    variant="nav"
                    iconOnly
                    className="h-10 w-10 border-sidebar-border/40 bg-sidebar-accent/20 hover:bg-sidebar-accent/50"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border">
                Coin Balance
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <CoinBalanceBadge variant="nav" className="w-full justify-center border-sidebar-border/40 bg-sidebar-accent/20 hover:bg-sidebar-accent/50" />
        )}

        {/* User Card & Logout */}
        <div className="flex items-center justify-between gap-2">
          {sidebarCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={ROUTES.settings}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent/20 hover:bg-sidebar-accent/50 border border-sidebar-border/35 transition-colors"
                  >
                    <Avatar className="h-7 w-7 border border-sidebar-border/40">
                      <AvatarImage src={user?.imageUrl} alt={displayName} />
                      <AvatarFallback className="text-[10px] bg-pink-500/10 text-pink-500">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground">{email}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex flex-1 items-center gap-2.5 min-w-0 rounded-xl p-1.5 bg-sidebar-accent/20 border border-sidebar-border/20">
              <Link href={ROUTES.settings} className="shrink-0">
                <Avatar className="h-7 w-7 border border-sidebar-border/40 transition-transform hover:scale-105">
                  <AvatarImage src={user?.imageUrl} alt={displayName} />
                  <AvatarFallback className="text-[10px] bg-pink-500/10 text-pink-500">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-1 flex-col overflow-hidden text-left leading-tight">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/50">
                  {email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1 text-sidebar-foreground/45 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 active:scale-95 shrink-0"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size={sidebarCollapsed ? "icon" : "default"}
          className="w-full text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground h-9"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2 text-xs font-medium">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
