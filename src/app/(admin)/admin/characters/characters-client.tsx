"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Sparkles, AlertCircle, Search, X, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminCharacter } from "@/lib/data/admin-characters";

async function fetchCharacters(): Promise<AdminCharacter[]> {
  const res = await fetch("/api/admin/characters");
  if (!res.ok) throw new Error("Failed to load characters");
  const json = (await res.json()) as { characters: AdminCharacter[] };
  return json.characters;
}

interface AdminCharactersClientProps {
  initialCharacters?: AdminCharacter[];
}

type FilterType = "all" | "catalog" | "user";
type PublishFilter = "all" | "published" | "draft";

export function AdminCharactersClient({ initialCharacters }: AdminCharactersClientProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCharacter | null>(null);

  const [previewCharacter, setPreviewCharacter] = useState<AdminCharacter | null>(null);
  const [deleteCharacter, setDeleteCharacter] = useState<AdminCharacter | null>(null);
  const [photoEditCharacter, setPhotoEditCharacter] = useState<AdminCharacter | null>(null);
  const [quickProfileMedia, setQuickProfileMedia] = useState<ProfileMediaState>({
    avatarUrl: "",
    previewVideoUrl: "",
    cardDisplayMode: "image",
  });

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [aiModelFilter, setAiModelFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: characters = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "characters"],
    queryFn: fetchCharacters,
    initialData: initialCharacters,
  });

  // Build unique filter options from data
  const categories = useMemo(
    () => Array.from(new Set(characters.map((c) => c.category).filter(Boolean))).sort(),
    [characters],
  );
  const aiModels = useMemo(
    () => Array.from(new Set(characters.map((c) => c.aiModel).filter((m): m is string => !!m))).sort(),
    [characters],
  );
  const genders = useMemo(
    () => Array.from(new Set(characters.map((c) => c.gender).filter(Boolean))).sort(),
    [characters],
  );
  const styles = useMemo(
    () => Array.from(new Set(characters.map((c) => c.style).filter(Boolean))).sort(),
    [characters],
  );

  // Filter characters client-side
  const filteredCharacters = useMemo(() => {
    let result = characters;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const haystack = [
          c.name,
          c.tagline,
          c.description,
          c.category,
          ...(c.tags || []),
          c.slug ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    // Type filter
    if (filterType === "catalog") {
      result = result.filter((c) => !c.createdBy);
    } else if (filterType === "user") {
      result = result.filter((c) => !!c.createdBy);
    }

    // Publish filter
    if (publishFilter === "published") {
      result = result.filter((c) => c.isPublished);
    } else if (publishFilter === "draft") {
      result = result.filter((c) => !c.isPublished);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // AI Model filter
    if (aiModelFilter !== "all") {
      result = result.filter((c) => c.aiModel === aiModelFilter);
    }

    // Gender filter
    if (genderFilter !== "all") {
      result = result.filter((c) => c.gender === genderFilter);
    }

    // Style filter
    if (styleFilter !== "all") {
      result = result.filter((c) => c.style === styleFilter);
    }

    return result;
  }, [characters, searchQuery, filterType, publishFilter, categoryFilter, aiModelFilter, genderFilter, styleFilter]);

  const activeFilterCount = [
    filterType !== "all",
    publishFilter !== "all",
    categoryFilter !== "all",
    aiModelFilter !== "all",
    genderFilter !== "all",
    styleFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearchQuery("");
    setFilterType("all");
    setPublishFilter("all");
    setCategoryFilter("all");
    setAiModelFilter("all");
    setGenderFilter("all");
    setStyleFilter("all");
  }

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
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New character
          </Button>
        }
      />

      {/* Search & Filters */}
      {!isLoading && !isError && characters.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, tagline, category, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="catalog">Catalog (Platform)</SelectItem>
                    <SelectItem value="user">User Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={publishFilter} onValueChange={(v) => setPublishFilter(v as PublishFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">AI Model</label>
                <Select value={aiModelFilter} onValueChange={setAiModelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {aiModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Gender</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Style</label>
                <Select value={styleFilter} onValueChange={setStyleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {styles.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <strong>{filteredCharacters.length}</strong> of{" "}
              <strong>{characters.length}</strong> characters
            </span>
            {filteredCharacters.length === 0 && characters.length > 0 && (
              <span>No characters match your filters.</span>
            )}
          </div>
        </div>
      )}

      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error)?.message ?? "Failed to load characters from the database."}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No characters yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first character to get started. Characters appear in the explore page and can be chatted with.
          </p>
          <Button onClick={openCreate} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Create character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredCharacters.map((c, index) => (
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
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{deleteCharacter?.name}</span>? This action cannot be
              undone and will delete all associated conversations.
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
                    },
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
