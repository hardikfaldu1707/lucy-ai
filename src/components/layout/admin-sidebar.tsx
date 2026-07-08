"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { ADMIN_NAV } from "@/constants/routes";
import { adminNavLinkClassName, isAdminNavActive } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex"
      aria-label="Admin navigation"
    >
      <div className="flex h-16 shrink-0 items-center px-4">
        <Logo />
        <span
          className="ml-2 rounded-lg bg-pink-500/10 border border-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-500 uppercase tracking-wider"
          translate="no"
        >
          Admin
        </span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-3">
        {ADMIN_NAV.map((item) => {
          const active = isAdminNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(adminNavLinkClassName(active))}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
