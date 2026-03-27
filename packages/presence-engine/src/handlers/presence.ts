import { PRESENCE, RATE_LIMITS, CHAT } from "@nonley/config";
import { stripLinks } from "@nonley/crypto";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  JoinRoomPayload,
  LeaveRoomPayload,
  HeartbeatPayload,
  Reaction,
  RoomPresence,
  PresenceUser,
  ReactionType,
} from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS, commands } from "../redis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const VALID_REACTIONS = new Set<string>([
  "wave",
  "nod",
  "lightbulb",
  "question",
  "fire",
]);

export function createPresenceHandler(
  io: IoServer,
  socket: IoSocket,
  redis: Redis,
  prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;

  async function onJoinRoom(payload: JoinRoomPayload): Promise<void> {
    try {
      const { roomHash } = payload;
      if (!roomHash || typeof roomHash !== "string" || roomHash.length > 200)
        return;

      await socket.join(roomHash);
      await socket.join(`chat:${roomHash}`);

      // Atomic: add user to set + increment count only if new
      await commands.roomJoin(redis, roomHash, userId);

      await Promise.all([
        redis.sadd(KEYS.userRooms(userId), roomHash),
        redis.set(
          KEYS.userHeartbeat(userId, roomHash),
          Date.now().toString(),
          "EX",
          Math.floor(PRESENCE.HEARTBEAT_TIMEOUT_MS / 1000),
        ),
      ]);

      const presence = await buildRoomPresence(roomHash, userId, redis, prisma);
      socket.emit("presence_update", presence);
      socket.to(roomHash).emit("presence_update", presence);
    } catch (err) {
      console.error(`[presence] Error joining room:`, err);
      socket.emit("error", {
        code: "JOIN_FAILED",
        message: "Failed to join room",
      });
    }
  }

  async function onLeaveRoom(payload: LeaveRoomPayload): Promise<void> {
    try {
      if (!payload.roomHash || typeof payload.roomHash !== "string") return;
      await leaveRoom(payload.roomHash);
    } catch (err) {
      console.error(`[presence] Error leaving room:`, err);
    }
  }

  async function onHeartbeat(payload: HeartbeatPayload): Promise<void> {
    try {
      if (!payload.roomHash || typeof payload.roomHash !== "string") return;
      const { roomHash } = payload;
      await redis.set(
        KEYS.userHeartbeat(userId, roomHash),
        Date.now().toString(),
        "EX",
        Math.floor(PRESENCE.HEARTBEAT_TIMEOUT_MS / 1000),
      );
    } catch (err) {
      console.error(`[presence] Heartbeat failed: user=${userId}`, err);
    }
  }

  async function onSendReaction(
    reaction: Omit<Reaction, "timestamp">,
  ): Promise<void> {
    if (!reaction.roomHash || typeof reaction.roomHash !== "string") return;
    if (!VALID_REACTIONS.has(reaction.type as string)) return;

    const key = KEYS.rateLimitReaction(userId);
    const exists = await redis.exists(key);
    if (exists) return;
    await redis.set(key, "1", "PX", RATE_LIMITS.REACTIONS_COOLDOWN_MS);

    const fullReaction: Reaction = {
      ...reaction,
      type: reaction.type as ReactionType,
      fromUserId: userId,
      timestamp: Date.now(),
    };

    socket.to(reaction.roomHash).emit("reaction", fullReaction);
  }

  async function onSendWhisper(payload: {
    chatId: string;
    content: string;
  }): Promise<void> {
    if (
      !payload.chatId ||
      typeof payload.chatId !== "string" ||
      !payload.content ||
      typeof payload.content !== "string" ||
      payload.content.length > CHAT.MAX_MESSAGE_LENGTH
    )
      return;

    const key = KEYS.rateLimitWhisper(userId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    if (count > RATE_LIMITS.WHISPER_INITIATIONS_PER_HOUR) return;

    const sanitizedContent = CHAT.LINK_STRIPPING
      ? stripLinks(payload.content)
      : payload.content;

    const messageId = crypto.randomUUID();

    try {
      await prisma.microChatMessage.create({
        data: {
          id: messageId,
          chatId: payload.chatId,
          senderId: userId,
          content: sanitizedContent,
        },
      });
    } catch (err) {
      console.error("[presence] Failed to persist whisper:", err);
      return;
    }

    const whisperRoom = `whisper:${payload.chatId}`;
    io.to(whisperRoom).emit("whisper_message", {
      id: messageId,
      chatId: payload.chatId,
      senderId: userId,
      content: sanitizedContent,
      createdAt: new Date(),
    });
  }

  async function onSendRoomChat(payload: {
    chatId: string;
    content: string;
  }): Promise<void> {
    if (
      !payload.chatId ||
      typeof payload.chatId !== "string" ||
      !payload.content ||
      typeof payload.content !== "string" ||
      payload.content.length > CHAT.MAX_MESSAGE_LENGTH
    )
      return;

    const key = KEYS.rateLimitRoomChat(payload.chatId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    if (count > RATE_LIMITS.ROOM_CHAT_MESSAGES_PER_HOUR) return;

    const sanitizedContent = CHAT.LINK_STRIPPING
      ? stripLinks(payload.content)
      : payload.content;

    // Use cached user data from socket instead of DB query per message
    const senderName =
      (socket.data.userName as string | undefined) ?? "Anonymous";
    const senderAvatar = (socket.data.userAvatar as string | undefined) ?? "";

    const messageId = crypto.randomUUID();

    const chatRoom = `chat:${payload.chatId}`;
    io.to(chatRoom).emit("room_chat_message", {
      id: messageId,
      chatId: payload.chatId,
      senderId: userId,
      senderName,
      senderAvatar,
      content: sanitizedContent,
      createdAt: new Date(),
    });
  }

  async function onToggleFocus(enabled: boolean): Promise<void> {
    if (typeof enabled !== "boolean") return;
    socket.data.focusMode = enabled;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { focusMode: enabled },
      });
    } catch (err) {
      console.error("[presence] Failed to persist focus mode:", err);
    }

    if (!enabled) {
      const summary = { waves: 0, newCircleMembers: [], missedReactions: 0 };
      socket.emit("focus_summary", summary);
    }
  }

  async function onDisconnect(): Promise<void> {
    try {
      const rooms = await redis.smembers(KEYS.userRooms(userId));
      await Promise.all(rooms.map((roomHash) => leaveRoom(roomHash)));
      await redis.del(KEYS.userRooms(userId));
    } catch (err) {
      console.error(`[presence] Error during disconnect cleanup:`, err);
    }
  }

  async function leaveRoom(roomHash: string): Promise<void> {
    await socket.leave(roomHash);

    // Atomic: remove user from set + decrement count only if was present
    const newCount = await commands.roomLeave(redis, roomHash, userId);

    await Promise.all([
      redis.srem(KEYS.userRooms(userId), roomHash),
      redis.del(KEYS.userHeartbeat(userId, roomHash)),
    ]);

    // Only broadcast if room still has users
    if (newCount > 0) {
      const presence = await buildRoomPresence(roomHash, userId, redis, prisma);
      io.to(roomHash).emit("presence_update", presence);
    }
  }

  return {
    onJoinRoom,
    onLeaveRoom,
    onHeartbeat,
    onSendReaction,
    onSendWhisper,
    onSendRoomChat,
    onToggleFocus,
    onDisconnect,
  };
}

async function buildRoomPresence(
  roomHash: string,
  currentUserId: string,
  redis: Redis,
  prisma: PrismaClient,
): Promise<RoomPresence> {
  const [totalCountStr, roomUserIds] = await Promise.all([
    redis.get(KEYS.roomCount(roomHash)),
    redis.smembers(KEYS.roomUsers(roomHash)),
  ]);

  const totalCount = Math.max(parseInt(totalCountStr ?? "0", 10), 0);

  // Ring 1: Friends in this room
  const friendIds = await redis.smembers(KEYS.userFriends(currentUserId));
  const friendSet = new Set(friendIds);

  const ring1Ids: string[] = [];
  const nonFriendIds: string[] = [];

  for (const id of roomUserIds) {
    if (id === currentUserId) continue;
    if (friendSet.has(id)) {
      ring1Ids.push(id);
    } else {
      nonFriendIds.push(id);
    }
  }

  // Ring 2: Sample of neighbors (non-friends)
  const ring2Ids = nonFriendIds.slice(0, PRESENCE.RING2_SAMPLE_SIZE);

  // Batch fetch user data from DB
  const allUserIds = [...ring1Ids, ...ring2Ids];
  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            privacyDefault: true,
          },
        })
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const validPrivacyLevels = new Set([
    "ghost",
    "anonymous",
    "circles_only",
    "open",
  ]);

  function toPresenceUser(id: string, ring: 1 | 2 | 3): PresenceUser {
    const user = userMap.get(id);
    const rawPrivacy = user?.privacyDefault ?? "open";
    const privacyLevel = validPrivacyLevels.has(rawPrivacy)
      ? (rawPrivacy as PresenceUser["privacyLevel"])
      : "open";

    return {
      userId: id,
      name: user?.name ?? "Anonymous",
      avatarUrl: user?.avatarUrl ?? "",
      privacyLevel,
      ring,
    };
  }

  const ring1: PresenceUser[] = ring1Ids.map((id) => toPresenceUser(id, 1));
  const ring2: PresenceUser[] = ring2Ids.map((id) => toPresenceUser(id, 2));

  const othersCount = Math.max(totalCount - 1, 0);

  return {
    roomHash,
    totalCount,
    ring1,
    ring2,
    ring3Count: Math.max(othersCount - ring1.length - ring2.length, 0),
  };
}
