import type { z } from "zod";
import type { mediaScopeSchema } from "@/lib/validation/schemas";

export type MediaScope = z.infer<typeof mediaScopeSchema>;

function cryptoRandom(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function extFromContentType(contentType: string): string {
  return contentType.split("/")[1]?.split("+")[0] ?? "bin";
}

export function buildUploadKey(params: {
  scope: MediaScope;
  profileId: string;
  contentType: string;
  characterId?: string;
  platformName?: string;
}): string {
  const ext = extFromContentType(params.contentType);
  const id = cryptoRandom();

  if (params.scope === "platform") {
    const name = params.platformName ?? id;
    return `platform/${name}.${ext}`;
  }

  if (params.scope === "character" && params.characterId) {
    return `characters/${params.characterId}/${id}.${ext}`;
  }

  return `users/${params.profileId}/${id}.${ext}`;
}
