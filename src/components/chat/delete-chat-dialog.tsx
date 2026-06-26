"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useChatStore } from "@/store/chat-store";

interface DeleteChatDialogProps {
  conversationId: string;
  characterName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onDeleted?: () => void;
}

export function DeleteChatDialog({
  conversationId,
  characterName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
  onDeleted,
}: DeleteChatDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearConversation = useChatStore((s) => s.clearConversation);
  const [internalOpen, setInternalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete chat");
      }
      clearConversation(conversationId);
      await queryClient.invalidateQueries({ queryKey: ["public-chat", "conversations"] });
      toast.success("Chat deleted");
      setOpen(false);
      onDeleted?.();
      router.push(ROUTES.publicChat);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete chat");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Delete chat"
            className="border-white/15 bg-transparent text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete chat</DialogTitle>
          <DialogDescription>
            Delete your entire conversation with{" "}
            <span className="font-semibold text-foreground">{characterName}</span>? All messages
            will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button type="button" variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
