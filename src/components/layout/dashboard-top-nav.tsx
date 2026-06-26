"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { NotificationCenter } from "./notification-center";
import { UserMenu } from "./user-menu";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

function usePageTitle(pathname: string): string | null {
  if (pathname.startsWith("/admin")) {
    const segment = pathname.split("/")[2] ?? "";
    if (!segment) return "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
  return null;
}

export function DashboardTopNav() {
  const pathname = usePathname();
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const pageTitle = usePageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] pt-safe items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-xl sm:h-16 sm:pt-0 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {pageTitle && (
        <div className={cn("flex items-center gap-2 text-sm", "lg:hidden")}>
          <span className="text-muted-foreground">Admin</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{pageTitle}</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <CoinBalanceBadge variant="nav" className="hidden sm:flex" />
        <ThemeToggle />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
