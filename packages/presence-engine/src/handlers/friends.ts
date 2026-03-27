import { stripLinks } from "@nonley/crypto";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  FriendMessageData,
} from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS } from "../redis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0;
}

export function createFriendsHandler(
  io: IoServer,
  socket: IoSocket,
  redis: Redis,
  prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;

  // Track user online for friends
  async function trackOnline(): Promise<void> {
    await redis.set(KEYS.userOnline(userId), socket.id, "EX", 120);
    const friends = await getFriendIds();
    if (friends.length === 0) return;

    // Pipeline: batch all friend lookups in one round trip
    const pipeline = redis.pipeline();
    for (const friendId of friends) {
      pipeline.get(KEYS.userOnline(friendId));
    }
    const results = await pipeline.exec();

    if (results) {
      for (let i = 0; i < friends.length; i++) {
        const [err, socketId] = results[i] ?? [];
        if (!err && socketId && typeof socketId === "string") {
          io.to(socketId).emit("friend_online", { userId });
        }
      }
    }
  }

  async function trackOffline(): Promise<void> {
    await redis.del(KEYS.userOnline(userId));
    const friends = await getFriendIds();
    if (friends.length === 0) return;

    const pipeline = redis.pipeline();
    for (const friendId of friends) {
      pipeline.get(KEYS.userOnline(friendId));
    }
    const results = await pipeline.exec();

    if (results) {
      for (let i = 0; i < friends.length; i++) {
        const [err, socketId] = results[i] ?? [];
        if (!err && socketId && typeof socketId === "string") {
          io.to(socketId).emit("friend_offline", { userId });
        }
      }
    }
  }

  async function getFriendIds(): Promise<string[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });
    return friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );
  }

  async function onSendFriendRequest(payload: {
    targetUserId: string;
  }): Promise<void> {
    try {
      const { targetUserId } = payload;
      if (!isNonEmptyString(targetUserId) || targetUserId === userId) return;

      // Check if already friends
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: targetUserId },
            { userAId: targetUserId, userBId: userId },
          ],
        },
      });
      if (existing) return;

      // Check if request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { fromId: userId, toId: targetUserId, status: "pending" },
            { fromId: targetUserId, toId: userId, status: "pending" },
          ],
        },
      });

      if (existingRequest) {
        if (existingRequest.fromId === targetUserId) {
          await acceptRequest(existingRequest.id);
        }
        return;
      }

      const request = await prisma.friendRequest.create({
        data: { fromId: userId, toId: targetUserId },
        include: {
          from: { select: { id: true, name: true, avatarUrl: true } },
          to: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      const targetSocketId = await redis.get(KEYS.userOnline(targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend_request_received", {
          id: request.id,
          fromId: request.fromId,
          toId: request.toId,
          status: request.status as "pending",
          createdAt: request.createdAt,
          from: request.from,
          to: request.to,
        });
      }
    } catch (err) {
      console.error("[friends] Error sending friend request:", err);
    }
  }

  async function acceptRequest(requestId: string): Promise<void> {
    const request = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
      include: {
        from: { select: { id: true, name: true, avatarUrl: true } },
        to: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const [userAId, userBId] =
      request.fromId < request.toId
        ? [request.fromId, request.toId]
        : [request.toId, request.fromId];

    const friendship = await prisma.friendship.create({
      data: { userAId, userBId },
    });

    // Atomic pipeline: add to both friends sets
    const pipeline = redis.pipeline();
    pipeline.sadd(KEYS.userFriends(request.fromId), request.toId);
    pipeline.sadd(KEYS.userFriends(request.toId), request.fromId);
    pipeline.get(KEYS.userOnline(request.fromId));
    pipeline.get(KEYS.userOnline(request.toId));
    const results = await pipeline.exec();

    const fromSocketId = results?.[2]?.[1] as string | null;
    const toSocketId = results?.[3]?.[1] as string | null;

    if (fromSocketId) {
      io.to(fromSocketId).emit("friend_request_accepted", {
        requestId,
        friendship: {
          id: friendship.id,
          userId: request.toId,
          name: request.to?.name ?? "Anonymous",
          avatarUrl: request.to?.avatarUrl ?? "",
        },
      });
    }
    if (toSocketId) {
      io.to(toSocketId).emit("friend_request_accepted", {
        requestId,
        friendship: {
          id: friendship.id,
          userId: request.fromId,
          name: request.from?.name ?? "Anonymous",
          avatarUrl: request.from?.avatarUrl ?? "",
        },
      });
    }
  }

  async function onAcceptFriendRequest(payload: {
    requestId: string;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.requestId)) return;

      const request = await prisma.friendRequest.findUnique({
        where: { id: payload.requestId },
      });
      if (!request || request.toId !== userId || request.status !== "pending")
        return;
      await acceptRequest(payload.requestId);
    } catch (err) {
      console.error("[friends] Error accepting friend request:", err);
    }
  }

  async function onDeclineFriendRequest(payload: {
    requestId: string;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.requestId)) return;

      const request = await prisma.friendRequest.findUnique({
        where: { id: payload.requestId },
      });
      if (!request || request.toId !== userId || request.status !== "pending")
        return;

      await prisma.friendRequest.update({
        where: { id: payload.requestId },
        data: { status: "declined" },
      });

      const fromSocketId = await redis.get(KEYS.userOnline(request.fromId));
      if (fromSocketId) {
        io.to(fromSocketId).emit("friend_request_declined", {
          requestId: payload.requestId,
        });
      }
    } catch (err) {
      console.error("[friends] Error declining friend request:", err);
    }
  }

  async function onRemoveFriend(payload: {
    friendshipId: string;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.friendshipId)) return;

      const friendship = await prisma.friendship.findUnique({
        where: { id: payload.friendshipId },
      });
      if (!friendship) return;
      if (friendship.userAId !== userId && friendship.userBId !== userId)
        return;

      const friendId =
        friendship.userAId === userId ? friendship.userBId : friendship.userAId;

      await prisma.friendship.delete({ where: { id: payload.friendshipId } });

      // Atomic pipeline: remove from both friends sets
      const pipeline = redis.pipeline();
      pipeline.srem(KEYS.userFriends(userId), friendId);
      pipeline.srem(KEYS.userFriends(friendId), userId);
      await pipeline.exec();
    } catch (err) {
      console.error("[friends] Error removing friend:", err);
    }
  }

  async function onSendFriendMessage(payload: {
    friendshipId: string;
    content: string;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.friendshipId)) return;
      if (
        !isNonEmptyString(payload.content) ||
        payload.content.trim().length === 0 ||
        payload.content.length > 2000
      )
        return;
      const sanitizedContent = stripLinks(payload.content.trim());

      const friendship = await prisma.friendship.findUnique({
        where: { id: payload.friendshipId },
      });
      if (!friendship) return;
      if (friendship.userAId !== userId && friendship.userBId !== userId)
        return;

      const friendId =
        friendship.userAId === userId ? friendship.userBId : friendship.userAId;

      // Use cached user data from socket
      const senderName =
        (socket.data.userName as string | undefined) ?? "Anonymous";
      const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

      const message = await prisma.friendMessage.create({
        data: {
          friendshipId: payload.friendshipId,
          senderId: userId,
          content: sanitizedContent,
        },
      });

      const messageData: FriendMessageData = {
        id: message.id,
        friendshipId: payload.friendshipId,
        senderId: userId,
        senderName,
        senderAvatar,
        content: sanitizedContent,
        createdAt: message.createdAt,
      };

      socket.emit("friend_message", messageData);
      const friendSocketId = await redis.get(KEYS.userOnline(friendId));
      if (friendSocketId) {
        io.to(friendSocketId).emit("friend_message", messageData);
      }
    } catch (err) {
      console.error("[friends] Error sending friend message:", err);
    }
  }

  async function onGetFriends(): Promise<void> {
    // Handled via REST API — used for online status sync
  }

  async function onGetFriendRequests(): Promise<void> {
    // Handled via REST API
  }

  return {
    onSendFriendRequest,
    onAcceptFriendRequest,
    onDeclineFriendRequest,
    onRemoveFriend,
    onSendFriendMessage,
    onGetFriends,
    onGetFriendRequests,
    trackOnline,
    trackOffline,
  };
}
