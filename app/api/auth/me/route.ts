import { NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { destroySession, readSession } from "@/lib/auth";
import { getUserById } from "@/lib/queries/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const user = await getUserById(session.sub);
    if (!user || Number(user.is_active) !== 1) {
      // Revoke the cookie if the account no longer exists / was deactivated.
      await destroySession();
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleError(err);
  }
}
