import { requireAuth, successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await requireAuth();

    // Prisma cascades will handle related records
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
