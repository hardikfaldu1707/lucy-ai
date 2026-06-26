"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { CoinBalanceBadge } from "@/components/shared/coin-balance-badge";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV } from "@/constants/routes";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";

export function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar pt-safe lg:hidden"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close">
                <X />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {DASHBOARD_NAV.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <NavIcon name={item.icon} className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <CoinBalanceBadge variant="nav" className="w-full justify-center" />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
