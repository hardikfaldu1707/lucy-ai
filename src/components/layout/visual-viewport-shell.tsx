"use client";

import { useEffect, useState } from "react";
import { BELOW_MD_MEDIA_QUERY } from "@/constants/breakpoints";
import { useVisualViewport } from "@/hooks/use-visual-viewport-height";
import { cn } from "@/lib/utils";

interface VisualViewportShellProps {
  /** When false, children render without viewport locking. */
  enabled?: boolean;
  /** Prevent body scroll while the shell is active (mobile). */
  lockBody?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Locks a chat (or full-screen) subtree to the visual viewport on mobile.
 * Uses fixed positioning + CSS vars so the bottom input stays above the iOS keyboard.
 */
export function VisualViewportShell({
  enabled = true,
  lockBody = false,
  className,
  children,
}: VisualViewportShellProps) {
  const { shellStyle, keyboardOpen, height } = useVisualViewport();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(BELOW_MD_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = enabled && isMobile && height > 0;
  const pendingMobileShell = enabled && isMobile && height === 0;

  useEffect(() => {
    if (!lockBody || !active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lockBody, active]);

  if (pendingMobileShell) {
    return (
      <div className={cn("flex min-h-dvh min-h-0 flex-col overflow-hidden", className)}>
        {children}
      </div>
    );
  }

  if (!active) {
    if (className) {
      return <div className={className}>{children}</div>;
    }
    return <>{children}</>;
  }

  return (
    <div
      className={cn("flex min-h-0 flex-col overflow-hidden", className)}
      style={shellStyle}
      data-keyboard-open={keyboardOpen ? "true" : "false"}
    >
      {children}
    </div>
  );
}
