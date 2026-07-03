"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DASHBOARD_NAV } from "@/constants/routes";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}
      aria-label="Dashboard navigation"
    >
      <div className={cn("flex h-16 items-center px-4", sidebarCollapsed && "justify-center px-2")}>
        <Logo showText={!sidebarCollapsed} />
      </div>
      <Separator />
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 space-y-1 p-3">
          {DASHBOARD_NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-98",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm scale-[1.01]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1",
                  sidebarCollapsed && "justify-center px-2 hover:translate-x-0"
                )}
                aria-current={active ? "page" : undefined}
              >
                <NavIcon
                  name={item.icon}
                  className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                {!sidebarCollapsed && (
                  <span className="transition-colors duration-200">
                    {item.title}
                  </span>
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
      </TooltipProvider>
      {!sidebarCollapsed && (
        <div className="border-t px-3 py-3">
          <CoinBalanceBadge variant="nav" className="w-full justify-center" />
        </div>
      )}
      <div className="p-3">
        <Button
          variant="ghost"
          size={sidebarCollapsed ? "icon" : "default"}
          className="w-full"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
