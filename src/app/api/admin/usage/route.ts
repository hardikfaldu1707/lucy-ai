import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { usageByModel, usageByCharacter, usageTotals } from "@/lib/data/ai-usage";
import { topCharacters } from "@/lib/data/admin-stats";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [byModel, byCharacter, totals, top] = await Promise.all([
    usageByModel(),
    usageByCharacter(),
    usageTotals(),
    topCharacters(),
  ]);

  // Attach character names to the per-character usage rows.
  const names = new Map(top.map((t) => [t.characterId, t.name]));
  const byCharacterNamed = byCharacter.map((c) => ({
    ...c,
    name: names.get(c.characterId) ?? c.characterId,
  }));

  return NextResponse.json({ totals, byModel, byCharacter: byCharacterNamed, popularity: top });
}
