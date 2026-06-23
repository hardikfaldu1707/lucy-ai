import { ROUTES } from "@/constants/routes";

/** True when an admin nav item should appear active (includes nested routes). */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.admin) return pathname === ROUTES.admin;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const adminNavLinkClassName = (active: boolean) =>
  [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
  ].join(" ");
