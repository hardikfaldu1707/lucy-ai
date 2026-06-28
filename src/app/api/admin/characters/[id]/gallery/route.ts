import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import {
  appendGalleryItem,
  getGalleryItems,
} from "@/lib/data/admin-characters";
import { getCharacterOwnership } from "@/lib/data/character-ownership";
import { normalizeGalleryItemInput } from "@/types/gallery";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const items = await getGalleryItems(id);
  if (!items) {
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }

  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ownership = await getCharacterOwnership(id);
  if (!ownership) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeGalleryItemInput(body);
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid item: url and type (image|video) are required" },
      { status: 400 },
    );
  }

  const result = await appendGalleryItem(id, normalized);
  if (!result) {
    return NextResponse.json({ error: "Failed to add gallery item" }, { status: 500 });
  }

  return NextResponse.json(
    { items: result.items, index: result.index, item: result.items[result.index] },
    { status: 201 },
  );
}
