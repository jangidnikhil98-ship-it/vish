import "server-only";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import type { ContactInput } from "@/lib/validators/contact";

export async function createEnquiry(input: ContactInput): Promise<void> {
  await db.insert(enquiries).values({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    message: input.message,
  });
}
