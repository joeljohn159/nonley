import { NextRequest, NextResponse } from "next/server";

import { requireAuth, successResponse, errorResponse } from "@/lib/api-helpers";
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
      return errorResponse(new Error("Friendship not found"));
    }

    if (friendship.userAId !== userId && friendship.userBId !== userId) {
      return errorResponse(new Error("Not your friendship"));
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const content = body.content?.trim();

    if (!content || content.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 1-2000 characters" },
        { status: 400 },
      );
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return errorResponse(new Error("Friendship not found"));
    }

    if (friendship.userAId !== userId && friendship.userBId !== userId) {
      return errorResponse(new Error("Not your friendship"));
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
