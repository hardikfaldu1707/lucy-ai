"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

interface DeleteCharacterDialogProps {
  characterId: string;
  characterName: string;
  variant?: "dashboard" | "browse";
  onDeleteSuccess?: () => void;
}

export function DeleteCharacterDialog({
  characterId,
  characterName,
  variant = "dashboard",
  onDeleteSuccess,
}: DeleteCharacterDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete character");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-girls"] }),
        queryClient.invalidateQueries({ queryKey: ["chat-browse", "characters"] }),
        queryClient.invalidateQueries({ queryKey: ["public-chat", "conversations"] }),
      ]);
      toast.success(`${characterName} deleted`);
      setOpen(false);
      onDeleteSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete character");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Delete ${characterName}`}
          className={cn(
            "h-8 w-8 shrink-0",
            variant === "browse"
              ? "border-white/15 bg-black/40 text-white backdrop-blur-sm hover:bg-red-500/80 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-500"
              : "border-border bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete AI girl</DialogTitle>
          <DialogDescription>
            Permanently delete{" "}
            <span className="font-semibold text-foreground">{characterName}</span>? All chats,
            messages, and memories for this companion will be removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
