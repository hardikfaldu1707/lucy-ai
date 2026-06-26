"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { NotificationCenter } from "./notification-center";
import { UserMenu } from "./user-menu";
import { useUIStore } from "@/store/ui-store";

export function DashboardTopNav() {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

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
      <div className="ml-auto flex items-center gap-1">
        <CoinBalanceBadge variant="nav" className="hidden sm:flex" />
        <ThemeToggle />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
