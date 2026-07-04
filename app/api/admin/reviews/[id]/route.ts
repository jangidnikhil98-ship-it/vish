import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteReview } from "@/lib/queries/admin/reviews";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) return new NextResponse("Invalid ID", { status: 400 });

    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
