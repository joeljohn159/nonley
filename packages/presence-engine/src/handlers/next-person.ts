import { NEXT_PERSON } from "@nonley/config";
import type { ServerToClientEvents, ClientToServerEvents } from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS } from "../redis";

import { getPlanLimits, incrementDailyCount } from "./limits";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NextPersonSession {
  users: string[];
  roomHash: string;
}

export function createNextPersonHandler(
  io: IoServer,
  socket: IoSocket,
  redis: Redis,
  prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;
  const plan: string = socket.data.plan ?? "free";

  const sessionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  socket.on("disconnect", () => {
    for (const timer of sessionTimeouts.values()) {
      clearTimeout(timer);
    }
    sessionTimeouts.clear();
  });

  async function onNextPerson(payload: { roomHash: string }): Promise<void> {
    try {
      const { roomHash } = payload;
      if (!roomHash || typeof roomHash !== "string") return;

      // Check cooldown
      const cooldown = await redis.exists(KEYS.nextPersonCooldown(userId));
      if (cooldown) {
        socket.emit("next_person_no_match", {
          reason: "Please wait a moment before finding the next person.",
        });
        return;
      }

      // Atomic check-and-increment for daily limit
      const limits = getPlanLimits(plan);
      const dateStr = todayDateStr();
      const key = KEYS.dailyNextSkips(userId, dateStr);
      const count = await incrementDailyCount(redis, key);

      if (count > limits.nextPersonSkipsPerDay) {
        socket.emit("limit_exceeded", {
          feature: "next_person",
          limit: limits.nextPersonSkipsPerDay,
          resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
        });
        return;
      }

      const roomUserIds = await redis.smembers(KEYS.roomUsers(roomHash));
      const recentMatchIds = await redis.smembers(
        KEYS.nextPersonRecentMatches(userId),
      );

      const recentSet = new Set(recentMatchIds);
      const candidates = roomUserIds.filter(
        (id) => id !== userId && !recentSet.has(id),
      );

      if (candidates.length === 0) {
        socket.emit("next_person_no_match", {
          reason: "No one available right now. Try again later!",
        });
        return;
      }

      const matchedUserId =
        candidates[Math.floor(Math.random() * candidates.length)];
      if (!matchedUserId) {
        socket.emit("next_person_no_match", {
          reason: "No one available right now. Try again later!",
        });
        return;
      }

      const matchedUser = await prisma.user.findUnique({
        where: { id: matchedUserId },
        select: { id: true, name: true, avatarUrl: true, focusMode: true },
      });

      if (!matchedUser || matchedUser.focusMode) {
        socket.emit("next_person_no_match", {
          reason: "No one available right now. Try again later!",
        });
        return;
      }

      const chat = await prisma.microChat.create({
        data: {
          roomHash,
          type: "next_person",
          participants: [userId, matchedUserId],
          createdById: userId,
          isActive: true,
          expiresAt: new Date(Date.now() + NEXT_PERSON.SESSION_TIMEOUT_MS),
        },
      });

      // Set cooldown
      await redis.set(
        KEYS.nextPersonCooldown(userId),
        "1",
        "PX",
        NEXT_PERSON.COOLDOWN_BETWEEN_SKIPS_MS,
      );

      // Track recent match
      await redis.sadd(KEYS.nextPersonRecentMatches(userId), matchedUserId);
      await redis.expire(
        KEYS.nextPersonRecentMatches(userId),
        NEXT_PERSON.EXCLUDE_RECENTLY_MATCHED_HOURS * 3600,
      );

      // Set session state
      const sessionData: NextPersonSession = {
        users: [userId, matchedUserId],
        roomHash,
      };
      await redis.set(
        KEYS.nextPersonSession(chat.id),
        JSON.stringify(sessionData),
        "PX",
        NEXT_PERSON.SESSION_TIMEOUT_MS,
      );

      // Log
      await prisma.nextPersonLog.create({
        data: {
          userId,
          roomHash,
          matchedWith: matchedUserId,
          chatId: chat.id,
        },
      });

      const nextRoom = `next:${chat.id}`;
      await socket.join(nextRoom);

      // Emit to initiator
      socket.emit("next_person_matched", {
        chatId: chat.id,
        matchedUser: {
          userId: matchedUser.id,
          name: matchedUser.name ?? "Anonymous",
          avatarUrl: matchedUser.avatarUrl ?? "",
        },
      });

      // Emit to matched user only
      const matchedSocketId = await redis.get(KEYS.userOnline(matchedUserId));
      if (matchedSocketId) {
        const senderName =
          (socket.data.userName as string | undefined) ?? "Anonymous";
        const senderAvatar =
          (socket.data.userAvatar as string | undefined) ?? "";

        io.to(matchedSocketId).emit("next_person_matched", {
          chatId: chat.id,
          matchedUser: {
            userId,
            name: senderName,
            avatarUrl: senderAvatar,
          },
        });
      }

      // Auto-end after timeout — store ref for cleanup
      const timer = setTimeout(async () => {
        sessionTimeouts.delete(chat.id);
        const session = await redis.get(KEYS.nextPersonSession(chat.id));
        if (session) {
          await endSession(chat.id);
        }
      }, NEXT_PERSON.SESSION_TIMEOUT_MS);
      sessionTimeouts.set(chat.id, timer);
    } catch (err) {
      console.error("[next-person] Error finding match:", err);
    }
  }

  async function onEndNextPerson(payload: { chatId: string }): Promise<void> {
    try {
      if (!payload.chatId || typeof payload.chatId !== "string") return;

      // Clear timeout
      const timer = sessionTimeouts.get(payload.chatId);
      if (timer) {
        clearTimeout(timer);
        sessionTimeouts.delete(payload.chatId);
      }

      await endSession(payload.chatId);
    } catch (err) {
      console.error("[next-person] Error ending session:", err);
    }
  }

  async function endSession(chatId: string): Promise<void> {
    await redis.del(KEYS.nextPersonSession(chatId));

    await prisma.microChat.update({
      where: { id: chatId },
      data: { isActive: false },
    });

    const nextRoom = `next:${chatId}`;
    io.to(nextRoom).emit("next_person_ended", { chatId });

    await prisma.nextPersonLog.updateMany({
      where: { chatId },
      data: { skipped: true },
    });
  }

  return { onNextPerson, onEndNextPerson };
}
