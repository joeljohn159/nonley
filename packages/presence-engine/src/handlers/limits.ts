import { CHAT_LIMITS } from "@nonley/config";
import type { ChatLimitsInfo } from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server, Socket } from "socket.io";

import { KEYS } from "../redis";

type PlanKey = keyof typeof CHAT_LIMITS;

export function getPlanLimits(plan: string): (typeof CHAT_LIMITS)[PlanKey] {
  const key = plan.toUpperCase() as PlanKey;
  return CHAT_LIMITS[key] ?? CHAT_LIMITS.FREE;
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Seconds until midnight UTC */
function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

export async function getDailyCount(
  redis: Redis,
  key: string,
): Promise<number> {
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}

export async function incrementDailyCount(
  redis: Redis,
  key: string,
): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, secondsUntilMidnight());
  }
  return count;
}

export function createLimitsHandler(
  _io: Server,
  socket: Socket,
  redis: Redis,
  _prisma: PrismaClient,
) {
  const userId: string = socket.data.userId;
  const plan: string = socket.data.plan ?? "free";

  async function onGetChatLimits(): Promise<void> {
    try {
      const limits = getPlanLimits(plan);
      const dateStr = todayDateStr();

      const [whisperCount, nextCount, groupCount] = await Promise.all([
        getDailyCount(redis, KEYS.dailyWhisperInits(userId, dateStr)),
        getDailyCount(redis, KEYS.dailyNextSkips(userId, dateStr)),
        getDailyCount(redis, KEYS.dailyGroupCreations(userId, dateStr)),
      ]);

      const info: ChatLimitsInfo = {
        plan,
        whisperInitiationsToday: whisperCount,
        whisperInitiationsMax: limits.whisperInitiationsPerDay,
        nextPersonSkipsToday: nextCount,
        nextPersonSkipsMax: limits.nextPersonSkipsPerDay,
        groupCreationsToday: groupCount,
        groupCreationsMax: limits.groupCreationsPerDay,
      };

      socket.emit("chat_limits", info);
    } catch (err) {
      console.error("[limits] Error fetching chat limits:", err);
    }
  }

  return { onGetChatLimits };
}
