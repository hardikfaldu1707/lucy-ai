import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createContactSubmission } from "@/lib/data/contact-submissions";
import { checkContactIpRateLimit, getIp } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation/parse";
import { contactSubmissionSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const ip = getIp(req);
  const ipBlocked = await checkContactIpRateLimit(ip);
  if (ipBlocked) return ipBlocked;

  const parsed = await parseBody(req, contactSubmissionSchema);
  if (!parsed.ok) return parsed.response;

  const { userId } = await auth();
  const { name, email, message } = parsed.data;

  const ok = await createContactSubmission({
    name,
    email,
    message,
    profileId: userId ?? null,
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
