"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/constants/routes";
import { useDialogA11y, usePrefersReducedMotion } from "@/hooks/use-dialog-a11y";
import { adminNavLinkClassName, isAdminNavActive } from "@/lib/admin-nav";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";

export function AdminMobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const reducedMotion = usePrefersReducedMotion();

  useDialogA11y(mobileNavOpen, () => setMobileNavOpen(false));

  const slideOffset = reducedMotion ? 0 : "-100%";

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          <m.div
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <m.aside
            initial={{ x: slideOffset }}
            animate={{ x: 0 }}
            exit={{ x: slideOffset }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-sidebar text-sidebar-foreground overscroll-contain lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin mobile navigation"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-3">
              {ADMIN_NAV.map((item) => {
                const active = isAdminNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(adminNavLinkClassName(active))}
                    aria-current={active ? "page" : undefined}
                  >
                    <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
}
