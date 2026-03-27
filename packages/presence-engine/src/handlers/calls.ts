import type {
  ServerToClientEvents,
  ClientToServerEvents,
  CallSession,
} from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS, safeParseJson } from "../redis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const CALL_TIMEOUT_MS = 30_000;

interface ActiveCallData {
  callerId: string;
  calleeId: string;
  type: "audio" | "video";
  accepted?: boolean;
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0;
}

export function createCallHandler(
  io: IoServer,
  socket: IoSocket,
  redis: Redis,
  prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;

  // Track active timeouts so they can be cleared
  const callTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  socket.on("disconnect", () => {
    for (const timer of callTimeouts.values()) {
      clearTimeout(timer);
    }
    callTimeouts.clear();
  });

  async function onCallUser(payload: {
    targetUserId: string;
    type: "audio" | "video";
  }): Promise<void> {
    try {
      const { targetUserId, type } = payload;
      if (!isNonEmptyString(targetUserId) || targetUserId === userId) return;
      if (type !== "audio" && type !== "video") return;

      // Must be friends
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: targetUserId },
            { userAId: targetUserId, userBId: userId },
          ],
        },
      });
      if (!friendship) return;

      // Check if target is online
      const targetSocketId = await redis.get(KEYS.userOnline(targetUserId));
      if (!targetSocketId) return;

      const caller = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, avatarUrl: true },
      });
      const callee = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true, avatarUrl: true },
      });

      const callLog = await prisma.callLog.create({
        data: {
          callerId: userId,
          calleeId: targetUserId,
          type,
          status: "ringing",
        },
      });

      const callData: ActiveCallData = {
        callerId: userId,
        calleeId: targetUserId,
        type,
      };
      await redis.set(
        KEYS.activeCall(callLog.id),
        JSON.stringify(callData),
        "EX",
        300,
      );

      const callSession: CallSession = {
        callId: callLog.id,
        callerId: userId,
        callerName: caller?.name ?? "Anonymous",
        callerAvatar: caller?.avatarUrl ?? "",
        calleeId: targetUserId,
        calleeName: callee?.name ?? "Anonymous",
        calleeAvatar: callee?.avatarUrl ?? "",
        type,
        status: "ringing",
      };

      io.to(targetSocketId).emit("call_incoming", callSession);
      socket.emit("call_incoming", callSession);

      // Auto-miss after timeout — track ref for cleanup
      const timer = setTimeout(async () => {
        callTimeouts.delete(callLog.id);
        const raw = await redis.get(KEYS.activeCall(callLog.id));
        const parsed = safeParseJson<ActiveCallData>(raw);
        if (parsed && !parsed.accepted) {
          await redis.del(KEYS.activeCall(callLog.id));
          await prisma.callLog.update({
            where: { id: callLog.id },
            data: { status: "missed", endedAt: new Date() },
          });
          socket.emit("call_ended", { callId: callLog.id });
          const currentTargetSocketId = await redis.get(
            KEYS.userOnline(targetUserId),
          );
          if (currentTargetSocketId) {
            io.to(currentTargetSocketId).emit("call_ended", {
              callId: callLog.id,
            });
          }
        }
      }, CALL_TIMEOUT_MS);
      callTimeouts.set(callLog.id, timer);
    } catch (err) {
      console.error("[calls] Error initiating call:", err);
    }
  }

  async function onAcceptCall(payload: { callId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.callId)) return;

      const raw = await redis.get(KEYS.activeCall(payload.callId));
      const parsed = safeParseJson<ActiveCallData>(raw);
      if (!parsed || parsed.calleeId !== userId) return;

      // Atomic: set accepted flag
      parsed.accepted = true;
      await redis.set(
        KEYS.activeCall(payload.callId),
        JSON.stringify(parsed),
        "EX",
        3600,
      );

      // Clear the auto-miss timeout
      const timer = callTimeouts.get(payload.callId);
      if (timer) {
        clearTimeout(timer);
        callTimeouts.delete(payload.callId);
      }

      await prisma.callLog.update({
        where: { id: payload.callId },
        data: { status: "active", startedAt: new Date() },
      });

      const callerSocketId = await redis.get(KEYS.userOnline(parsed.callerId));
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_accepted", { callId: payload.callId });
      }
      socket.emit("call_accepted", { callId: payload.callId });
    } catch (err) {
      console.error("[calls] Error accepting call:", err);
    }
  }

  async function onDeclineCall(payload: { callId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.callId)) return;

      const raw = await redis.get(KEYS.activeCall(payload.callId));
      const parsed = safeParseJson<ActiveCallData>(raw);
      if (!parsed) return;
      if (parsed.calleeId !== userId && parsed.callerId !== userId) return;

      await redis.del(KEYS.activeCall(payload.callId));

      // Clear timeout
      const timer = callTimeouts.get(payload.callId);
      if (timer) {
        clearTimeout(timer);
        callTimeouts.delete(payload.callId);
      }

      await prisma.callLog.update({
        where: { id: payload.callId },
        data: { status: "declined", endedAt: new Date() },
      });

      const otherId =
        parsed.callerId === userId ? parsed.calleeId : parsed.callerId;
      const otherSocketId = await redis.get(KEYS.userOnline(otherId));
      if (otherSocketId) {
        io.to(otherSocketId).emit("call_declined", { callId: payload.callId });
      }
      socket.emit("call_declined", { callId: payload.callId });
    } catch (err) {
      console.error("[calls] Error declining call:", err);
    }
  }

  async function onEndCall(payload: { callId: string }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.callId)) return;

      const raw = await redis.get(KEYS.activeCall(payload.callId));
      const parsed = safeParseJson<ActiveCallData>(raw);
      if (!parsed) return;
      if (parsed.callerId !== userId && parsed.calleeId !== userId) return;

      await redis.del(KEYS.activeCall(payload.callId));

      const callLog = await prisma.callLog.findUnique({
        where: { id: payload.callId },
      });
      const duration =
        callLog?.startedAt && callLog.status === "active"
          ? Math.floor((Date.now() - callLog.startedAt.getTime()) / 1000)
          : null;

      await prisma.callLog.update({
        where: { id: payload.callId },
        data: { status: "ended", endedAt: new Date(), duration },
      });

      const otherId =
        parsed.callerId === userId ? parsed.calleeId : parsed.callerId;
      const otherSocketId = await redis.get(KEYS.userOnline(otherId));
      if (otherSocketId) {
        io.to(otherSocketId).emit("call_ended", { callId: payload.callId });
      }
      socket.emit("call_ended", { callId: payload.callId });
    } catch (err) {
      console.error("[calls] Error ending call:", err);
    }
  }

  async function onSendCallSignal(payload: {
    callId: string;
    signal: unknown;
  }): Promise<void> {
    try {
      if (!isNonEmptyString(payload.callId) || !payload.signal) return;

      const raw = await redis.get(KEYS.activeCall(payload.callId));
      const parsed = safeParseJson<ActiveCallData>(raw);
      if (!parsed) return;
      if (parsed.callerId !== userId && parsed.calleeId !== userId) return;

      const otherId =
        parsed.callerId === userId ? parsed.calleeId : parsed.callerId;
      const otherSocketId = await redis.get(KEYS.userOnline(otherId));
      if (otherSocketId) {
        io.to(otherSocketId).emit("call_signal", {
          callId: payload.callId,
          signal: payload.signal,
        });
      }
    } catch (err) {
      console.error("[calls] Error relaying call signal:", err);
    }
  }

  return {
    onCallUser,
    onAcceptCall,
    onDeclineCall,
    onEndCall,
    onSendCallSignal,
  };
}
