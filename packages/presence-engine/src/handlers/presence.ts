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
} from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS } from "../redis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

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

      await socket.join(roomHash);

      await Promise.all([
        redis.incr(KEYS.roomCount(roomHash)),
        redis.sadd(KEYS.roomUsers(roomHash), userId),
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
      await leaveRoom(payload.roomHash);
    } catch (err) {
      console.error(`[presence] Error leaving room:`, err);
    }
  }

  async function onHeartbeat(payload: HeartbeatPayload): Promise<void> {
    const { roomHash } = payload;
    await redis.set(
      KEYS.userHeartbeat(userId, roomHash),
      Date.now().toString(),
      "EX",
      Math.floor(PRESENCE.HEARTBEAT_TIMEOUT_MS / 1000),
    );
  }

  async function onSendReaction(
    reaction: Omit<Reaction, "timestamp">,
  ): Promise<void> {
    const key = KEYS.rateLimitReaction(userId);
    const exists = await redis.exists(key);
    if (exists) return;
    await redis.set(key, "1", "PX", RATE_LIMITS.REACTIONS_COOLDOWN_MS);

    const fullReaction: Reaction = {
      ...reaction,
      fromUserId: userId,
      timestamp: Date.now(),
    };

    socket.to(reaction.roomHash).emit("reaction", fullReaction);
  }

  async function onSendWhisper(payload: {
    chatId: string;
    content: string;
  }): Promise<void> {
    if (!payload.content || payload.content.length > CHAT.MAX_MESSAGE_LENGTH)
      return;

    // Rate limit: 5 whisper initiations per hour
    const key = KEYS.rateLimitWhisper(userId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    if (count > RATE_LIMITS.WHISPER_INITIATIONS_PER_HOUR) return;

    // Strip links from whisper messages
    const sanitizedContent = CHAT.LINK_STRIPPING
      ? stripLinks(payload.content)
      : payload.content;

    const messageId = crypto.randomUUID();

    // Persist to database
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
    if (!payload.content || payload.content.length > CHAT.MAX_MESSAGE_LENGTH)
      return;

    // Rate limit: 30 messages per hour per room
    const key = KEYS.rateLimitRoomChat(payload.chatId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    if (count > RATE_LIMITS.ROOM_CHAT_MESSAGES_PER_HOUR) return;

    const sanitizedContent = CHAT.LINK_STRIPPING
      ? stripLinks(payload.content)
      : payload.content;

    // Fetch sender info
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarUrl: true },
    });

    const messageId = crypto.randomUUID();

    // Persist to database
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
      console.error("[presence] Failed to persist room chat:", err);
    }

    const chatRoom = `chat:${payload.chatId}`;
    io.to(chatRoom).emit("room_chat_message", {
      id: messageId,
      chatId: payload.chatId,
      senderId: userId,
      senderName: sender?.name ?? "Anonymous",
      senderAvatar: sender?.avatarUrl ?? "",
      content: sanitizedContent,
      createdAt: new Date(),
    });
  }

  async function onToggleFocus(enabled: boolean): Promise<void> {
    socket.data.focusMode = enabled;

    // Persist focus mode to database
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { focusMode: enabled },
      });
    } catch (err) {
      console.error("[presence] Failed to persist focus mode:", err);
    }

    if (!enabled) {
      // TODO: Track actual missed events during focus mode
      const summary = { waves: 0, newCircleMembers: [], missedReactions: 0 };
      socket.emit("focus_summary", summary);
    }
  }

  async function onDisconnect(): Promise<void> {
    try {
      const rooms = await redis.smembers(KEYS.userRooms(userId));
      await Promise.all(rooms.map((roomHash) => leaveRoom(roomHash)));
      await redis.del(KEYS.userRooms(userId));
      console.log(`[presence] User disconnected: ${userId}`);
    } catch (err) {
      console.error(`[presence] Error during disconnect cleanup:`, err);
    }
  }

  async function leaveRoom(roomHash: string): Promise<void> {
    await socket.leave(roomHash);

    // Check if user was actually in the room before decrementing
    const removed = await redis.srem(KEYS.roomUsers(roomHash), userId);

    if (removed > 0) {
      const count = await redis.decr(KEYS.roomCount(roomHash));
      // Guard against negative counts
      if (count < 0) {
        await redis.set(KEYS.roomCount(roomHash), "0");
      }
    }

    await Promise.all([
      redis.srem(KEYS.userRooms(userId), roomHash),
      redis.del(KEYS.userHeartbeat(userId, roomHash)),
    ]);

    const presence = await buildRoomPresence(roomHash, userId, redis, prisma);
    io.to(roomHash).emit("presence_update", presence);
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
  const ring1Ids = roomUserIds.filter(
    (id) => friendIds.includes(id) && id !== currentUserId,
  );

  // Ring 2: Sample neighbors (non-friends)
  const nonFriendIds = roomUserIds.filter(
    (id) => !friendIds.includes(id) && id !== currentUserId,
  );
  const ring2Ids = nonFriendIds.slice(0, PRESENCE.RING2_SAMPLE_SIZE);

  // Fetch actual user data from database
  const allUserIds = [...ring1Ids, ...ring2Ids];
  const users =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: allUserIds },
            isBot: false, // Exclude bot flag from response but include bots in presence
          },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            privacyDefault: true,
          },
        })
      : [];

  // Also include bots (but don't expose isBot)
  const botUsers =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: allUserIds },
            isBot: true,
          },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            privacyDefault: true,
          },
        })
      : [];

  const allUsers = [...users, ...botUsers];
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  function toPresenceUser(id: string, ring: 1 | 2 | 3): PresenceUser {
    const user = userMap.get(id);
    return {
      userId: id,
      name: user?.name ?? "Anonymous",
      avatarUrl: user?.avatarUrl ?? "",
      privacyLevel:
        (user?.privacyDefault as PresenceUser["privacyLevel"]) ?? "open",
      ring,
    };
  }

  const ring1: PresenceUser[] = ring1Ids.map((id) => toPresenceUser(id, 1));
  const ring2: PresenceUser[] = ring2Ids.map((id) => toPresenceUser(id, 2));

  return {
    roomHash,
    totalCount,
    ring1,
    ring2,
    ring3Count: Math.max(totalCount - ring1.length - ring2.length, 0),
  };
}
