"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PageHeartLoader } from "@/components/shared/heart-loader";

function isInternalNavigationLink(anchor: HTMLAnchorElement, currentPath: string): boolean {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#")) return false;

  let url: URL;
  try {
    url = new URL(anchor.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) return false;

  const next = `${url.pathname}${url.search}`;
  const current = `${currentPath}${window.location.search}`;
  return next !== current;
}

const SHOW_DELAY_MS = 800;

function isAdminRoute(path: string): boolean {
  return path.startsWith("/admin");
}

export function NavigationHeartLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const pathnameRef = useRef(pathname);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  useEffect(() => {
    pathnameRef.current = pathname;
    clearShowTimer();
    const hideTimer = window.setTimeout(() => setVisible(false), 0);
    return () => window.clearTimeout(hideTimer);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || !isInternalNavigationLink(anchor, pathnameRef.current)) return;

      const href = anchor.getAttribute("href") ?? "";
      const url = new URL(anchor.href);
      const nextPath = url.pathname;

      // Skip fullscreen overlay for admin-to-admin navigation
      if (isAdminRoute(pathnameRef.current) && isAdminRoute(nextPath)) return;

      clearShowTimer();
      showTimerRef.current = setTimeout(() => {
        setVisible(true);
      }, SHOW_DELAY_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearShowTimer();
    };
  }, []);

  if (!visible) return null;
  return <PageHeartLoader overlay />;
}
