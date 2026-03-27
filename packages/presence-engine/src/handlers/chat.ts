import { CHAT } from "@nonley/config";
import { stripLinks } from "@nonley/crypto";
import type { ServerToClientEvents, ClientToServerEvents } from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS, safeParseJson } from "../redis";

import { getPlanLimits, incrementDailyCount } from "./limits";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0;
}

export function createChatHandler(
  io: IoServer,
  socket: IoSocket,
  redis: Redis,
  prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;
  const plan: string = socket.data.plan ?? "free";

  // Track active timeouts so they can be cleared on manual action
  const whisperTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Clean up all timeouts on disconnect
  socket.on("disconnect", () => {
    for (const timer of whisperTimeouts.values()) {
      clearTimeout(timer);
    }
    whisperTimeouts.clear();
  });

  // --- 1-1 Whisper Lifecycle ---

  async function onInitiateWhisper(payload: {
    targetUserId: string;
  }): Promise<void> {
    try {
      const { targetUserId } = payload;
      if (!isNonEmptyString(targetUserId) || targetUserId === userId) return;

      const limits = getPlanLimits(plan);
      const dateStr = todayDateStr();
      const key = KEYS.dailyWhisperInits(userId, dateStr);

      // Atomic check-and-increment
      const count = await incrementDailyCount(redis, key);
      if (count > limits.whisperInitiationsPerDay) {
        socket.emit("limit_exceeded", {
          feature: "whisper",
          limit: limits.whisperInitiationsPerDay,
          resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
        });
        return;
      }

      const userRooms = await redis.smembers(KEYS.userRooms(userId));
      const roomHash = userRooms[0];
      if (!roomHash) return;

      const chat = await prisma.microChat.create({
        data: {
          roomHash,
          type: "whisper",
          participants: [userId, targetUserId],
          createdById: userId,
          isActive: true,
          expiresAt: new Date(Date.now() + CHAT.EXPIRY_HOURS * 60 * 60 * 1000),
        },
      });

      const whisperRoom = `whisper:${chat.id}`;
      await socket.join(whisperRoom);

      await redis.set(
        KEYS.whisperPending(chat.id),
        JSON.stringify({ from: userId, to: targetUserId }),
        "PX",
        CHAT.WHISPER_REQUEST_TIMEOUT_MS,
      );

      await prisma.chatInitiationLog.create({
        data: {
          userId,
          targetId: targetUserId,
          roomHash,
          chatId: chat.id,
        },
      });

      const senderName =
        (socket.data.userName as string | undefined) ?? "Anonymous";
      const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

      const targetSocketId = await redis.get(KEYS.userOnline(targetUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("whisper_request", {
          chatId: chat.id,
          from: {
            userId,
            name: senderName,
            avatarUrl: senderAvatar,
          },
        });
      }

      // Auto-decline after timeout — store ref so it can be cleared
      const timer = setTimeout(async () => {
        whisperTimeouts.delete(chat.id);
        const pending = await redis.get(KEYS.whisperPending(chat.id));
        if (pending) {
          await redis.del(KEYS.whisperPending(chat.id));
          await prisma.microChat.update({
            where: { id: chat.id },
            data: { isActive: false },
          });
          socket.emit("whisper_declined", { chatId: chat.id });
        }
      }, CHAT.WHISPER_REQUEST_TIMEOUT_MS);
      whisperTimeouts.set(chat.id, timer);
    } catch (err) {
      console.error("[chat] Error initiating whisper:", err);
    }
  }

  async function onAcceptWhisper(payload: { chatId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.chatId)) return;

      const pending = await redis.get(KEYS.whisperPending(payload.chatId));
      if (!pending) return;

      const parsed = safeParseJson<{ from: string; to: string }>(pending);
      if (!parsed || parsed.to !== userId) return;

      await redis.del(KEYS.whisperPending(payload.chatId));

      // Clear the auto-decline timeout
      const timer = whisperTimeouts.get(payload.chatId);
      if (timer) {
        clearTimeout(timer);
        whisperTimeouts.delete(payload.chatId);
      }

      const whisperRoom = `whisper:${payload.chatId}`;
      await socket.join(whisperRoom);

      io.to(whisperRoom).emit("whisper_accepted", {
        chatId: payload.chatId,
      });
    } catch (err) {
      console.error("[chat] Error accepting whisper:", err);
    }
  }

  async function onDeclineWhisper(payload: { chatId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.chatId)) return;

      const pending = await redis.get(KEYS.whisperPending(payload.chatId));
      if (!pending) return;

      const parsed = safeParseJson<{ from: string; to: string }>(pending);
      if (!parsed || parsed.to !== userId) return;

      await redis.del(KEYS.whisperPending(payload.chatId));

      // Clear the auto-decline timeout
      const timer = whisperTimeouts.get(payload.chatId);
      if (timer) {
        clearTimeout(timer);
        whisperTimeouts.delete(payload.chatId);
      }

      await prisma.microChat.update({
        where: { id: payload.chatId },
        data: { isActive: false },
      });

      const whisperRoom = `whisper:${payload.chatId}`;
      io.to(whisperRoom).emit("whisper_declined", {
        chatId: payload.chatId,
      });
    } catch (err) {
      console.error("[chat] Error declining whisper:", err);
    }
  }

  // --- Group Chat ---

  async function onCreateGroupChat(payload: {
    name: string;
    maxParticipants?: number;
  }): Promise<void> {
    try {
      if (
        !isNonEmptyString(payload.name) ||
        payload.name.length > CHAT.MAX_GROUP_CHAT_NAME_LENGTH
      )
        return;

      const limits = getPlanLimits(plan);
      const dateStr = todayDateStr();
      const key = KEYS.dailyGroupCreations(userId, dateStr);

      const count = await incrementDailyCount(redis, key);
      if (count > limits.groupCreationsPerDay) {
        socket.emit("limit_exceeded", {
          feature: "group_chat",
          limit: limits.groupCreationsPerDay,
          resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
        });
        return;
      }

      const userRooms = await redis.smembers(KEYS.userRooms(userId));
      const roomHash = userRooms[0];
      if (!roomHash) return;

      const maxP = payload.maxParticipants
        ? Math.min(
            Math.max(Math.floor(payload.maxParticipants), 2),
            limits.maxGroupParticipants,
          )
        : limits.maxGroupParticipants;

      const chat = await prisma.microChat.create({
        data: {
          roomHash,
          type: "group",
          name: payload.name.trim(),
          createdById: userId,
          participants: [userId],
          maxParticipants: maxP,
          isActive: true,
          expiresAt: new Date(
            Date.now() + CHAT.GROUP_CHAT_EXPIRY_HOURS * 60 * 60 * 1000,
          ),
        },
      });

      await redis.sadd(KEYS.roomGroupChats(roomHash), chat.id);

      const groupRoom = `group:${chat.id}`;
      await socket.join(groupRoom);

      const senderName =
        (socket.data.userName as string | undefined) ?? "Anonymous";
      const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

      const chatInfo = {
        id: chat.id,
        name: payload.name.trim(),
        roomHash,
        participantCount: 1,
        maxParticipants: maxP,
        createdBy: {
          userId,
          name: senderName,
          avatarUrl: senderAvatar,
        },
        isActive: true,
      };

      io.to(roomHash).emit("group_chat_created", chatInfo);
    } catch (err) {
      console.error("[chat] Error creating group chat:", err);
    }
  }

  async function onJoinGroupChat(payload: { chatId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.chatId)) return;

      const chat = await prisma.microChat.findUnique({
        where: { id: payload.chatId },
      });
      if (!chat || !chat.isActive || chat.type !== "group") return;
      if (chat.participants.includes(userId)) return;

      if (
        chat.maxParticipants &&
        chat.participants.length >= chat.maxParticipants
      ) {
        socket.emit("error", {
          code: "GROUP_FULL",
          message: "Group chat is full",
        });
        return;
      }

      // Use Prisma transaction to prevent race condition on participant count
      await prisma.$transaction(async (tx) => {
        const latest = await tx.microChat.findUnique({
          where: { id: payload.chatId },
        });
        if (!latest || !latest.isActive) return;
        if (latest.participants.includes(userId)) return;
        if (
          latest.maxParticipants &&
          latest.participants.length >= latest.maxParticipants
        )
          return;

        await tx.microChat.update({
          where: { id: payload.chatId },
          data: { participants: { push: userId } },
        });
      });

      const groupRoom = `group:${payload.chatId}`;
      await socket.join(groupRoom);

      const senderName =
        (socket.data.userName as string | undefined) ?? "Anonymous";
      const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

      io.to(groupRoom).emit("group_chat_joined", {
        chatId: payload.chatId,
        user: {
          userId,
          name: senderName,
          avatarUrl: senderAvatar,
        },
      });
    } catch (err) {
      console.error("[chat] Error joining group chat:", err);
    }
  }

  async function onLeaveGroupChat(payload: { chatId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.chatId)) return;

      const chat = await prisma.microChat.findUnique({
        where: { id: payload.chatId },
      });
      if (!chat) return;

      const newParticipants = chat.participants.filter((p) => p !== userId);

      await prisma.microChat.update({
        where: { id: payload.chatId },
        data: {
          participants: newParticipants,
          isActive: newParticipants.length > 0,
        },
      });

      const groupRoom = `group:${payload.chatId}`;
      await socket.leave(groupRoom);

      io.to(groupRoom).emit("group_chat_left", {
        chatId: payload.chatId,
        userId,
      });

      if (newParticipants.length === 0 && chat.roomHash) {
        await redis.srem(KEYS.roomGroupChats(chat.roomHash), payload.chatId);
      }
    } catch (err) {
      console.error("[chat] Error leaving group chat:", err);
    }
  }

  async function onSendGroupChat(payload: {
    chatId: string;
    content: string;
  }): Promise<void> {
    try {
      if (
        !isNonEmptyString(payload.chatId) ||
        !isNonEmptyString(payload.content) ||
        payload.content.length > CHAT.MAX_MESSAGE_LENGTH
      )
        return;

      const chat = await prisma.microChat.findUnique({
        where: { id: payload.chatId },
      });
      if (!chat || !chat.isActive || !chat.participants.includes(userId))
        return;

      const sanitizedContent = CHAT.LINK_STRIPPING
        ? stripLinks(payload.content)
        : payload.content;

      const senderName =
        (socket.data.userName as string | undefined) ?? "Anonymous";
      const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

      const messageId = crypto.randomUUID();

      await prisma.microChatMessage.create({
        data: {
          id: messageId,
          chatId: payload.chatId,
          senderId: userId,
          content: sanitizedContent,
        },
      });

      const groupRoom = `group:${payload.chatId}`;
      io.to(groupRoom).emit("group_chat_message", {
        id: messageId,
        chatId: payload.chatId,
        senderId: userId,
        senderName,
        senderAvatar,
        content: sanitizedContent,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error("[chat] Error sending group chat:", err);
    }
  }

  async function onListGroupChats(payload: {
    roomHash: string;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.roomHash)) return;

      const chats = await prisma.microChat.findMany({
        where: {
          roomHash: payload.roomHash,
          type: "group",
          isActive: true,
        },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const chatInfos = chats.map((c) => ({
        id: c.id,
        name: c.name ?? "Group",
        roomHash: c.roomHash,
        participantCount: c.participants.length,
        maxParticipants: c.maxParticipants,
        createdBy: {
          userId: c.creator?.id ?? "",
          name: c.creator?.name ?? "Anonymous",
          avatarUrl: c.creator?.avatarUrl ?? "",
        },
        isActive: c.isActive,
      }));

      socket.emit("group_chat_list", chatInfos);
    } catch (err) {
      console.error("[chat] Error listing group chats:", err);
    }
  }

  return {
    onInitiateWhisper,
    onAcceptWhisper,
    onDeclineWhisper,
    onCreateGroupChat,
    onJoinGroupChat,
    onLeaveGroupChat,
    onSendGroupChat,
    onListGroupChats,
  };
}
