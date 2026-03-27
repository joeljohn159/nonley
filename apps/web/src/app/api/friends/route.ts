import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) => {
      const friend = f.userAId === userId ? f.userB : f.userA;
      return {
        friendshipId: f.id,
        userId: friend.id,
        name: friend.name,
        avatarUrl: friend.avatarUrl,
        online: false, // Client checks via WebSocket
        createdAt: f.createdAt,
      };
    });

    return successResponse(friends);
  } catch (error) {
    return errorResponse(error);
  }
}

const sendRequestSchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { targetUserId } = await parseBody(req, sendRequestSchema);

    if (targetUserId === userId) {
      return errorResponse(new Error("Cannot send friend request to yourself"));
    }

    // Check already friends
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: targetUserId },
          { userAId: targetUserId, userBId: userId },
        ],
      },
    });
    if (existing) {
      return errorResponse(new Error("Already friends"));
    }

    // Check existing pending request
    const pendingRequest = await prisma.friendRequest.findFirst({
      where: {
        fromId: userId,
        toId: targetUserId,
        status: "pending",
      },
    });
    if (pendingRequest) {
      return successResponse(pendingRequest);
    }

    const request = await prisma.friendRequest.create({
      data: { fromId: userId, toId: targetUserId },
      include: {
        from: { select: { id: true, name: true, avatarUrl: true } },
        to: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return successResponse(request);
  } catch (error) {
    return errorResponse(error);
  }
}
