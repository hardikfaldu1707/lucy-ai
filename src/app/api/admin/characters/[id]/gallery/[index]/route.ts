import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  removeGalleryItemAt,
  reorderGalleryItems,
  updateGalleryItemAt,
} from "@/lib/data/admin-characters";
import { getCharacterOwnership } from "@/lib/data/character-ownership";
import type { GalleryMediaType } from "@/types/gallery";

function parseIndex(raw: string): number | null {
  const index = Number.parseInt(raw, 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return index;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, index: indexRaw } = await params;
  const index = parseIndex(indexRaw);
  if (index === null) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.fromIndex !== undefined && body.toIndex !== undefined) {
    const fromIndex = parseIndex(String(body.fromIndex));
    const toIndex = parseIndex(String(body.toIndex));
    if (fromIndex === null || toIndex === null) {
      return NextResponse.json({ error: "Invalid reorder indices" }, { status: 400 });
    }
    const items = await reorderGalleryItems(id, fromIndex, toIndex);
    if (!items) {
      return NextResponse.json({ error: "Failed to reorder gallery" }, { status: 400 });
    }
    return NextResponse.json({ items });
  }

  const patch: { tags?: string[]; type?: GalleryMediaType } = {};
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }
    patch.tags = body.tags as string[];
  }
  if (body.type !== undefined) {
    if (body.type !== "image" && body.type !== "video") {
      return NextResponse.json({ error: "type must be image or video" }, { status: 400 });
    }
    patch.type = body.type;
  }

  if (patch.tags === undefined && patch.type === undefined) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const items = await updateGalleryItemAt(id, index, patch);
  if (!items) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  return NextResponse.json({ items, item: items[index] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, index: indexRaw } = await params;
  const index = parseIndex(indexRaw);
  if (index === null) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const items = await removeGalleryItemAt(id, index);
  if (!items) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  return NextResponse.json({ items });
}
