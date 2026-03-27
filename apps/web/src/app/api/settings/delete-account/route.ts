import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
  ApiError,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const deleteSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth();

    // Require explicit confirmation to prevent accidental or CSRF-triggered deletion
    const { confirmation } = await parseBody(req, deleteSchema);
    if (confirmation !== "DELETE MY ACCOUNT") {
      throw new ApiError(
        400,
        "CONFIRMATION_REQUIRED",
        'Send { "confirmation": "DELETE MY ACCOUNT" } to confirm',
      );
    }

    // Prisma cascades will handle related records
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    console.log(
      `[account] User deleted: id=${session.user.id} email=${session.user.email}`,
    );

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
