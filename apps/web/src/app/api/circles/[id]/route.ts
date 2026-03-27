import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
  ApiError,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const updateCircleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const circle = await prisma.circle.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });
    if (!circle) throw new ApiError(404, "NOT_FOUND", "Circle not found");

    // Private circles: only members can view details
    if (!circle.isPublic) {
      const isMember = circle.members.some((m) => m.userId === session.user.id);
      if (!isMember) {
        throw new ApiError(
          403,
          "FORBIDDEN",
          "You are not a member of this circle",
        );
      }
    }

    return successResponse(circle);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const data = await parseBody(req, updateCircleSchema);

    const membership = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: { circleId: params.id, userId: session.user.id },
      },
    });
    if (!membership || membership.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "Only circle admins can update");
    }

    const circle = await prisma.circle.update({
      where: { id: params.id },
      data,
    });
    return successResponse(circle);
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
    const circle = await prisma.circle.findUnique({ where: { id: params.id } });
    if (!circle) throw new ApiError(404, "NOT_FOUND", "Circle not found");
    if (circle.createdBy !== session.user.id) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the creator can delete a circle",
      );
    }
    await prisma.circle.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
