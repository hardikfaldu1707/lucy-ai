"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AdminCharacterCard } from "@/components/admin/admin-character-card";
import {
  CharacterForm,
  type CharacterFormValues,
} from "@/components/admin/character-form";
import { CharacterPreviewDialog } from "@/components/admin/character-preview-dialog";
import {
  CharacterProfileMediaPicker,
  type ProfileMediaState,
} from "@/components/admin/character-profile-media-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminCharacter } from "@/lib/data/admin-characters";

async function fetchCharacters(): Promise<AdminCharacter[]> {
  const res = await fetch("/api/admin/characters");
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: AdminCharacter[] };
  return json.characters;
}

export function AdminCharactersClient() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCharacter | null>(null);

  // Redesign dialog states
  const [previewCharacter, setPreviewCharacter] = useState<AdminCharacter | null>(null);
  const [deleteCharacter, setDeleteCharacter] = useState<AdminCharacter | null>(null);
  const [photoEditCharacter, setPhotoEditCharacter] = useState<AdminCharacter | null>(null);
  const [quickProfileMedia, setQuickProfileMedia] = useState<ProfileMediaState>({
    avatarUrl: "",
    previewVideoUrl: "",
    cardDisplayMode: "image",
  });

  const { data: characters = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "characters"],
    queryFn: fetchCharacters,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "characters"] });

  const saveMutation = useMutation({
    mutationFn: async (values: CharacterFormValues) => {
      const isEdit = Boolean(editing);
      const url = isEdit
        ? `/api/admin/characters/${editing!.id}`
        : "/api/admin/characters";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to save character");
      }
      const json = (await res.json()) as { character: AdminCharacter };
      return { character: json.character, isEdit };
    },
    onSuccess: ({ character, isEdit }) => {
      toast.success(isEdit ? "Character updated" : "Character created");
      setFormOpen(false);
      setEditing(null);
      invalidate();
      if (!isEdit) setPreviewCharacter(character);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeProfileMediaMutation = useMutation({
    mutationFn: async ({
      id,
      avatarUrl,
      previewVideoUrl,
      cardDisplayMode,
    }: ProfileMediaState & { id: string }) => {
      const res = await fetch(`/api/admin/characters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl,
          previewVideoUrl: previewVideoUrl || null,
          cardDisplayMode,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to update profile media");
      }
    },
    onSuccess: () => {
      toast.success("Profile media updated");
      setPhotoEditCharacter(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete character");
      }
    },
    onSuccess: () => {
      toast.success("Character deleted");
      setDeleteCharacter(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(character: AdminCharacter) {
    setEditing(character);
    setFormOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Characters"
        description="All companions from the database — catalog and user-created. Deletes remove them everywhere on the site."
        action={<Button onClick={openCreate}>New character</Button>}
      />

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {(error as Error)?.message ?? "Failed to load characters from the database."}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : characters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No characters yet. Create your first one.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {characters.map((c, index) => (
            <AdminCharacterCard
              key={c.id}
              character={c}
              priority={index < 5}
              onPreview={() => setPreviewCharacter(c)}
              onEdit={() => openEdit(c)}
              onDelete={() => setDeleteCharacter(c)}
              onChangePhoto={() => {
                setPhotoEditCharacter(c);
                setQuickProfileMedia({
                  avatarUrl: c.avatarUrl,
                  previewVideoUrl: c.previewVideoUrl ?? "",
                  cardDisplayMode: c.cardDisplayMode,
                });
              }}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <CharacterForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          onSubmit={(values) => saveMutation.mutate(values)}
          isSubmitting={saveMutation.isPending}
        />
      )}

      {/* Preview Dialog */}
      {previewCharacter && (
        <CharacterPreviewDialog
          open={!!previewCharacter}
          onOpenChange={(open) => !open && setPreviewCharacter(null)}
          character={previewCharacter}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCharacter} onOpenChange={(open) => !open && setDeleteCharacter(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteCharacter?.name}</span>? This action cannot be undone and will delete all associated conversations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteCharacter(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteCharacter) {
                  deleteMutation.mutate(deleteCharacter.id, {
                    onSuccess: () => {
                      setDeleteCharacter(null);
                    }
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick profile media change */}
      <Dialog open={!!photoEditCharacter} onOpenChange={(open) => !open && setPhotoEditCharacter(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change profile media for {photoEditCharacter?.name}</DialogTitle>
            <DialogDescription>
              Upload a photo or video for the browse card. Video mode auto-creates a poster image.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CharacterProfileMediaPicker
              value={quickProfileMedia}
              onChange={(patch) => setQuickProfileMedia((prev) => ({ ...prev, ...patch }))}
              characterId={photoEditCharacter?.id}
              previewSeed={photoEditCharacter?.id ?? "preview-seed"}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={changeProfileMediaMutation.isPending}
              onClick={() => setPhotoEditCharacter(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={
                changeProfileMediaMutation.isPending ||
                !quickProfileMedia.avatarUrl.trim()
              }
              onClick={() => {
                if (photoEditCharacter) {
                  changeProfileMediaMutation.mutate({
                    id: photoEditCharacter.id,
                    ...quickProfileMedia,
                  });
                }
              }}
            >
              {changeProfileMediaMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
