import type { NextRequest } from "next/server";
import { contactSchema } from "@/lib/validators/contact";
import { createEnquiry } from "@/lib/queries/enquiries";
import { fail, handleError, ok } from "@/lib/api";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/contact
 * Mirrors PageController@contactusSubmit.
 * Body: { full_name, email, phone, message }
 */
export async function POST(req: NextRequest) {
  try {
    // 10 contact submissions per IP per day — generous for legitimate
    // users, prohibitive for spam-bots that would otherwise flood the
    // enquiries table.
    const ip = rateLimitKey(req);
    const limit = rateLimit(`contact:${ip}`, {
      limit: 10,
      windowMs: 24 * 60 * 60_000,
    });
    if (!limit.ok) {
      return fail(
        "You've sent too many enquiries today. Please email us directly.",
        429,
      );
    }

    const json = await req.json().catch(() => ({}));
    const input = contactSchema.parse(json);
    await createEnquiry(input);
    return ok(
      { message: "Thank you! Your enquiry has been submitted successfully." },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
