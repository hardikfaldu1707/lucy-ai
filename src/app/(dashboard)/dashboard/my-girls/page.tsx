"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DeleteCharacterDialog } from "@/components/character/delete-character-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useFlag } from "@/hooks/use-flags";
import type { MyCharacter } from "@/lib/data/characters-mine";

async function fetchMine(): Promise<MyCharacter[]> {
  const res = await fetch("/api/characters/mine");
  if (!res.ok) throw new Error("Failed to load");
  const json = (await res.json()) as { characters: MyCharacter[] };
  return json.characters;
}

export default function MyGirlsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-girls"],
    queryFn: fetchMine,
  });
  const canCreate = useFlag("user_created_characters") !== false;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My AI girls"
        description="The companions you created. Private to you."
        action={
          canCreate ? (
            <Button asChild>
              <Link href={ROUTES.create}>Create new</Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any yet. Hit “Create new” to design your own.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((c) => (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-border"
            >
              <Link
                href={ROUTES.characterProfile(c.slug ?? c.id)}
                className="block"
              >
                <div className="relative aspect-[3/4] w-full bg-muted">
                  {c.avatarUrl && (
                    <Image
                      src={c.avatarUrl}
                      alt={c.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="line-clamp-1 text-xs text-white/70">
                      {c.tagline || c.description}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="absolute right-2 top-2 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <DeleteCharacterDialog
                  characterId={c.id}
                  characterName={c.name}
                  variant="dashboard"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
