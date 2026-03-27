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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      throw new ApiError(404, "NOT_FOUND", "Friendship not found");
    }

    if (friendship.userAId !== userId && friendship.userBId !== userId) {
      throw new ApiError(403, "FORBIDDEN", "Not your friendship");
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limit = 50;

    const messages = await prisma.friendMessage.findMany({
      where: { friendshipId: params.id },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return successResponse({
      messages: items.map((m) => ({
        id: m.id,
        friendshipId: m.friendshipId,
        senderId: m.senderId,
        senderName: m.sender.name ?? "Anonymous",
        senderAvatar: m.sender.avatarUrl ?? "",
        content: m.content,
        createdAt: m.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be 2000 characters or less")
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Message cannot be empty after trimming"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { content } = await parseBody(req, messageSchema);

    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      throw new ApiError(404, "NOT_FOUND", "Friendship not found");
    }

    if (friendship.userAId !== userId && friendship.userBId !== userId) {
      throw new ApiError(403, "FORBIDDEN", "Not your friendship");
    }

    const message = await prisma.friendMessage.create({
      data: {
        friendshipId: params.id,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return successResponse({
      id: message.id,
      friendshipId: message.friendshipId,
      senderId: message.senderId,
      senderName: message.sender.name ?? "Anonymous",
      senderAvatar: message.sender.avatarUrl ?? "",
      content: message.content,
      createdAt: message.createdAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
