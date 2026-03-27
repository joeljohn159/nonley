import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { action } = await parseBody(req, actionSchema);

    const request = await prisma.friendRequest.findUnique({
      where: { id: params.id },
    });

    if (!request || request.toId !== userId || request.status !== "pending") {
      return errorResponse(new Error("Friend request not found"));
    }

    if (action === "accept") {
      await prisma.friendRequest.update({
        where: { id: params.id },
        data: { status: "accepted" },
      });

      const [userAId, userBId] =
        request.fromId < request.toId
          ? [request.fromId, request.toId]
          : [request.toId, request.fromId];

      const friendship = await prisma.friendship.create({
        data: { userAId, userBId },
      });

      return successResponse({ friendship });
    } else {
      await prisma.friendRequest.update({
        where: { id: params.id },
        data: { status: "declined" },
      });
      return successResponse({ declined: true });
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return errorResponse(new Error("Friendship not found"));
    }

    if (friendship.userAId !== userId && friendship.userBId !== userId) {
      return errorResponse(new Error("Not your friendship"));
    }

    await prisma.friendship.delete({ where: { id: params.id } });

    return successResponse({ removed: true });
  } catch (error) {
    return errorResponse(error);
  }
}
