import { NextRequest } from "next/server";

import {
  requireAuth,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const circle = await prisma.circle.findUnique({ where: { id: params.id } });
    if (!circle) throw new ApiError(404, "NOT_FOUND", "Circle not found");
    if (!circle.isPublic)
      throw new ApiError(403, "FORBIDDEN", "This circle is private");

    const existing = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId: params.id, userId: session.user.id },
      },
    });
    if (existing) throw new ApiError(409, "CONFLICT", "Already a member");

    await prisma.circleMember.create({
      data: { circleId: params.id, userId: session.user.id, role: "member" },
    });
    return successResponse({ joined: true }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    await prisma.circleMember.delete({
      where: {
        circleId_userId: { circleId: params.id, userId: session.user.id },
      },
    });
    return successResponse({ left: true });
  } catch (error) {
    return errorResponse(error);
  }
}
