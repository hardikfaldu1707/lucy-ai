"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { startChatWithCharacter } from "@/lib/chat/client";

interface StartChatButtonProps {
  characterSlug: string;
  className?: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function StartChatButton({
  characterSlug,
  className,
  label = "Start chat",
  size = "default",
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const href = await startChatWithCharacter(characterSlug);
      router.push(href);
    } catch (err) {
      console.error("[StartChatButton]", err);
      toast.error(err instanceof Error ? err.message : "Could not start chat");
      setLoading(false);
    }
  };

  return (
    <Button className={className} size={size} onClick={handleClick} disabled={loading}>
      <MessageCircle className="mr-2 h-4 w-4" />
      {loading ? "Opening…" : label}
    </Button>
  );
}
