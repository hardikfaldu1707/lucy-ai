"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/constants/routes";
import { useFlag } from "@/hooks/use-flags";
import { CharacterCard } from "@/components/character/character-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Character } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Romance", "Anime", "Fitness"];

export function CharactersBrowser({ characters }: { characters: Character[] }) {
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const canCreate = useFlag("user_created_characters") !== false;

  const items = useMemo(
    () =>
      characters.map((c) => ({
        ...c,
        isFavorite: favoriteOverrides[c.id] ?? c.isFavorite,
      })),
    [characters, favoriteOverrides],
  );

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.tagline.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || c.category === category;
      const matchFav = !favoritesOnly || c.isFavorite;
      return matchSearch && matchCategory && matchFav;
    });
  }, [items, search, category, favoritesOnly]);

  async function toggleFavorite(id: string) {
    try {
      const res = await fetch(`/api/characters/${id}/favorite`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const { isFavorite } = (await res.json()) as { isFavorite: boolean };
      setFavoriteOverrides((prev) => ({ ...prev, [id]: isFavorite }));
    } catch {
      toast.error("Could not update favorite");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Characters"
        description="Discover companions and start meaningful conversations."
        action={
          canCreate ? (
            <Button asChild>
              <Link href={ROUTES.createCharacter}>Create your own</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search characters"
          />
        </div>
        <Button
          variant={favoritesOnly ? "default" : "outline"}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Favorites
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              category === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No characters match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {items
          .flatMap((c) => c.tags)
          .filter((t, i, a) => a.indexOf(t) === i)
          .map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
      </div>
    </div>
  );
}
