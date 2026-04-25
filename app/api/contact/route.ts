import type { NextRequest } from "next/server";
import { contactSchema } from "@/lib/validators/contact";
import { createEnquiry } from "@/lib/queries/enquiries";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/contact
 * Mirrors PageController@contactusSubmit.
 * Body: { full_name, email, phone, message }
 */
export async function POST(req: NextRequest) {
  try {
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
