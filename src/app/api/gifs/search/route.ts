import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { searchFallbackGifs, type ChatGifItem } from "@/constants/chat-gif-fallback";
import { isAllowedGifUrl } from "@/lib/chat/gif-url";

type TenorMedia = {
  gif?: { url?: string };
  tinygif?: { url?: string };
  nanogif?: { url?: string };
};

type TenorResult = {
  id: string;
  title?: string;
  media_formats?: TenorMedia;
};

function fromTenorResult(item: TenorResult): ChatGifItem | null {
  const url = item.media_formats?.gif?.url ?? item.media_formats?.tinygif?.url;
  const previewUrl =
    item.media_formats?.tinygif?.url ??
    item.media_formats?.nanogif?.url ??
    item.media_formats?.gif?.url;
  if (!url || !previewUrl || !isAllowedGifUrl(url)) return null;
  return {
    id: item.id,
    url,
    previewUrl,
    title: item.title?.trim() || "GIF",
    tags: [],
  };
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const apiKey = process.env.TENOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ gifs: searchFallbackGifs(q), source: "fallback" });
  }

  const endpoint = q
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${apiKey}&client_key=lucy&limit=30&media_filter=gif,tinygif`
    : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&client_key=lucy&limit=30&media_filter=gif,tinygif`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ gifs: searchFallbackGifs(q), source: "fallback" });
    }
    const json = (await res.json()) as { results?: TenorResult[] };
    const gifs = (json.results ?? [])
      .map(fromTenorResult)
      .filter((g): g is ChatGifItem => g !== null);
    return NextResponse.json({
      gifs: gifs.length ? gifs : searchFallbackGifs(q),
      source: gifs.length ? "tenor" : "fallback",
    });
  } catch {
    return NextResponse.json({ gifs: searchFallbackGifs(q), source: "fallback" });
  }
}
