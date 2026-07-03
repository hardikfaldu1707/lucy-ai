import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";

const STYLE_MAP: Record<string, string> = {
  realistic: "realistic",
  photorealistic: "realistic",
  photo: "realistic",
  anime: "anime",
  manga: "anime",
  cartoon: "anime",
  drawing: "anime",
};

const ETHNICITY_MAP: Record<string, string> = {
  asian: "caucasian",
  black: "asian",
  african: "asian",
  white: "latina",
  caucasian: "latina",
  european: "latina",
  latina: "black",
  latino: "black",
  hispanic: "black",
  arab: "middle-eastern",
  "middle eastern": "middle-eastern",
  indian: "south-asian",
  elf: "mixed",
  demon: "european",
};

const HAIR_COLOR_MAP: Record<string, string> = {
  black: "blonde",
  blonde: "red",
  brown: "brown",
  red: "auburn",
  ginger: "auburn",
  grey: "platinum",
  gray: "platinum",
  silver: "platinum",
  white: "platinum",
  hazel: "pink",
  amber: "blue",
  orange: "blue",
  gold: "option-1782731914540",
  golden: "option-1782731914540",
  blue: "option-1782731932908",
  green: "option-1782731945306",
  violet: "option-1782732023835",
  purple: "option-1782732023835",
};

const HAIR_STYLE_MAP: Record<string, string> = {
  wavy: "option-1782731629326",
  bangs: "option-1782731514647",
  fringe: "option-1782731514647",
  ponytail: "option-1782731543834",
  short: "option-1782731567014",
  bob: "option-1782731567014",
  braided: "option-1782731456244",
  braids: "option-1782731456244",
  long: "option-1782731457232",
  straight: "option-1782731457232",
  bun: "option-1782731590896",
  buns: "option-1782731613551",
  "double buns": "option-1782731613551",
};

const BODY_TYPE_MAP: Record<string, string> = {
  slim: "slim",
  slender: "slim",
  thin: "slim",
  athletic: "athletic",
  fit: "athletic",
  toned: "athletic",
  curvy: "curvy",
  muscular: "petite",
  petite: "petite",
  voluptuous: "voluptuous",
};

const OUTFIT_MAP: Record<string, string> = {
  casual: "casual",
  dress: "dress",
  sporty: "sporty",
  elegant: "elegant",
  lingerie: "lingerie",
  cosplay: "cosplay",
  business: "business",
  suit: "business",
  beachwear: "beachwear",
  bikini: "beachwear",
  swimsuit: "beachwear",
};

function normalizeAndMap(value: string | undefined, map: Record<string, string>, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.toLowerCase().trim();
  
  if (map[normalized]) return map[normalized];
  
  for (const [key, mappedVal] of Object.entries(map)) {
    if (normalized.includes(key)) {
      return mappedVal;
    }
  }
  
  return fallback;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let { avatarUrl } = await req.json();
    if (!avatarUrl) {
      return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
    }

    // Convert AVIF to PNG on the fly to support OpenRouter/OpenAI vision model formats
    if (avatarUrl.toLowerCase().endsWith(".avif")) {
      avatarUrl = `https://images.weserv.nl/?url=${encodeURIComponent(avatarUrl)}&output=png`;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
    }

    // Call OpenRouter with Vision-enabled Nemotron Nano 12B VL free model
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Lucy Admin Appearance Detector",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image of a girl/companion and identify her matching visual attributes. 

You must output a raw JSON object containing these keys with the exact string values from the options below:
- style: "realistic" or "anime"
- ethnicity: "asian", "black", "white", "latina", "arab", "indian", "elf", or "demon" (Choose the closest match based on her physical features)
- hairColor: "black", "blonde", "brown", "red", "grey", "hazel", "amber", "gold", "blue", "green", or "violet"
- hairStyle: "wavy", "bangs", "ponytail", "short", "braided", "long", "bun", or "buns"
- bodyType: "slim", "athletic", "curvy", "muscular", or "voluptuous"
- outfit: "casual", "dress", "sporty", "elegant", "lingerie", "cosplay", "business", or "beachwear"

Ensure your output is valid JSON and contains ONLY the JSON object. Do not include markdown codeblocks or extra text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: avatarUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Vision API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean codeblocks if any (e.g. ```json ... ```)
    const cleanJsonText = reply.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const rawResult = JSON.parse(cleanJsonText);

    // Map natural values to the scrambled DB option keys
    const result = {
      style: normalizeAndMap(rawResult.style, STYLE_MAP, "realistic"),
      ethnicity: normalizeAndMap(rawResult.ethnicity, ETHNICITY_MAP, ""),
      hairColor: normalizeAndMap(rawResult.hairColor, HAIR_COLOR_MAP, ""),
      hairStyle: normalizeAndMap(rawResult.hairStyle, HAIR_STYLE_MAP, ""),
      bodyType: normalizeAndMap(rawResult.bodyType, BODY_TYPE_MAP, ""),
      outfit: normalizeAndMap(rawResult.outfit, OUTFIT_MAP, ""),
    };

    return NextResponse.json({ appearance: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to analyze image" }, { status: 500 });
  }
}
