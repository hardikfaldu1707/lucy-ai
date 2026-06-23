"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startChatWithCharacter } from "@/lib/chat/client";
import { cn } from "@/lib/utils";

interface StartChatLinkProps {
  characterSlug: string;
  children: ReactNode;
  className?: string;
  onStarted?: () => void;
  "aria-label"?: string;
}

export function StartChatLink({
  characterSlug,
  children,
  className,
  onStarted,
  "aria-label": ariaLabel,
}: StartChatLinkProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const href = await startChatWithCharacter(characterSlug);
      onStarted?.();
      router.push(href);
    } catch (err) {
      console.error("[StartChatLink]", err);
      toast.error(err instanceof Error ? err.message : "Could not start chat");
      setLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={cn(className, loading && "pointer-events-none opacity-70")}
      aria-busy={loading}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
