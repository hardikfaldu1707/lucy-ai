import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth/require-admin";
import { generateSuggestedQuestions } from "@/lib/ai/generate-suggested-questions";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  personality: z.array(z.string().max(80)).max(20).optional(),
  tags: z.array(z.string().max(80)).max(30).optional(),
  category: z.string().max(80).optional(),
  style: z.string().max(40).optional(),
  age: z.number().int().min(18).max(99).optional(),
});

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const questions = await generateSuggestedQuestions(parsed.data);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
