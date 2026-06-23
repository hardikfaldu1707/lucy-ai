"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CharacterModelSelect, DEFAULT_MODEL_VALUE } from "@/components/character/character-model-select";
import { useUserAiModels } from "@/hooks/use-ai-models";
import { aiModelLabel } from "@/constants/ai-models";
import type { MyCharacter } from "@/lib/data/characters-mine";

interface ChangeCharacterModelProps {
  character: MyCharacter;
}

export function ChangeCharacterModel({ character }: ChangeCharacterModelProps) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(character.aiModel ?? DEFAULT_MODEL_VALUE);
  const queryClient = useQueryClient();
  const { data: aiModels, isLoading } = useUserAiModels();

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiModel: model === DEFAULT_MODEL_VALUE ? null : model,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to update model");
      }
    },
    onSuccess: () => {
      toast.success("Model updated");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-girls"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full truncate"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setModel(character.aiModel ?? DEFAULT_MODEL_VALUE);
          setOpen(true);
        }}
      >
        Model: {aiModelLabel(character.aiModel ?? aiModels?.defaultModel)}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Change AI model</DialogTitle>
            <DialogDescription>
              Pick which model powers {character.name}. Only admin-approved models are available.
            </DialogDescription>
          </DialogHeader>
          <CharacterModelSelect
            value={model}
            onChange={setModel}
            models={aiModels?.models ?? []}
            defaultModel={aiModels?.defaultModel ?? ""}
            loading={isLoading}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
