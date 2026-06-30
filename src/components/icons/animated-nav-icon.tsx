"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, Compass, Crown, Heart, MessageCircle, Plus, Send, UserCircle } from "lucide-react";
import { BellIcon } from "@/components/ui/bell";
import { CompassIcon } from "@/components/ui/compass";
import { HeartIcon } from "@/components/ui/heart";
import { MessageCircleIcon } from "@/components/ui/message-circle";
import { SendIcon } from "@/components/ui/send";
import { NavIcon } from "@/components/layout/nav-icon";
import { usePrefersReducedMotion } from "@/hooks/use-dialog-a11y";
import { cn } from "@/lib/utils";

const LANDING_STATIC_ICONS: Record<string, LucideIcon> = {
  Create: Plus,
  Explore: Compass,
  Chat: MessageCircle,
  Profile: UserCircle,
  Premium: Crown,
};

const DEFAULT_ICON_SIZE = 20;

interface LandingNavIconProps {
  label: string;
  className?: string;
  size?: number;
}

/** Animated Lucide icons for landing sidebar / bottom nav (falls back to static Lucide). */
export function LandingNavIcon({ label, className, size = DEFAULT_ICON_SIZE }: LandingNavIconProps) {
  const reducedMotion = usePrefersReducedMotion();
  const staticClassName = cn(className, "shrink-0");

  if (reducedMotion) {
    const Icon = LANDING_STATIC_ICONS[label] ?? Plus;
    return <Icon className={staticClassName} strokeWidth={1.75} aria-hidden />;
  }

  switch (label) {
    case "Chat":
      return <MessageCircleIcon size={size} className={staticClassName} aria-hidden />;
    case "Explore":
      return <CompassIcon size={size} className={staticClassName} aria-hidden />;
    default: {
      const Icon = LANDING_STATIC_ICONS[label] ?? Plus;
      return <Icon className={staticClassName} strokeWidth={1.75} aria-hidden />;
    }
  }
}

interface DashboardNavIconProps {
  name: string;
  className?: string;
  size?: number;
}

/** Animated icons for dashboard mobile nav (MessageCircle in pilot). */
export function DashboardNavIcon({
  name,
  className,
  size = DEFAULT_ICON_SIZE,
}: DashboardNavIconProps) {
  const reducedMotion = usePrefersReducedMotion();

  if (!reducedMotion && name === "MessageCircle") {
    return <MessageCircleIcon size={size} className={cn(className, "shrink-0")} aria-hidden />;
  }

  return <NavIcon name={name} className={className} />;
}

interface AnimatedUiIconProps {
  className?: string;
  size?: number;
}

export function AnimatedBellIcon({ className, size = DEFAULT_ICON_SIZE }: AnimatedUiIconProps) {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return <Bell className={className} aria-hidden />;
  }
  return <BellIcon size={size} className={className} aria-hidden />;
}

export function AnimatedHeartIcon({ className, size = 14 }: AnimatedUiIconProps) {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return <Heart className={cn(className, "fill-white text-white")} aria-hidden />;
  }
  return <HeartIcon size={size} className={className} aria-hidden />;
}

export function AnimatedSendIcon({ className, size = 16 }: AnimatedUiIconProps) {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return <Send className={className} aria-hidden />;
  }
  return <SendIcon size={size} className={className} aria-hidden />;
}
