import { NextResponse } from "next/server";
import type { ZodType } from "zod";

// Reusable request-body validation. Mirrors the ergonomics of
// rateLimitUnavailableResponse(): a route calls parseBody, and on failure gets a
// ready-to-return NextResponse (HTTP 400 with flattened field errors); on success
// it gets the fully-typed, validated data.
//
// Usage:
//   const parsed = await parseBody(req, createMemorySchema);
//   if (!parsed.ok) return parsed.response;
//   const { type, title, content } = parsed.data;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const fields = result.error.flatten().fieldErrors;
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Validation failed", fields },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
}
