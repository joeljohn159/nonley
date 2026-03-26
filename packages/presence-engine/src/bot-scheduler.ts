import type { ServerToClientEvents, ClientToServerEvents } from "@nonley/types";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Server } from "socket.io";

import { KEYS } from "./redis";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class BotScheduler {
  private io: IoServer;
  private redis: Redis;
  private prisma: PrismaClient;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(io: IoServer, redis: Redis, prisma: PrismaClient) {
    this.io = io;
    this.redis = redis;
    this.prisma = prisma;
  }

  start(): void {
    this.interval = setInterval(() => {
      this.tick().catch((err) => console.error("[bot-scheduler] Error:", err));
    }, 60_000);
    console.log("[bot-scheduler] Started");
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log("[bot-scheduler] Stopped");
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const bots = await this.prisma.botProfile.findMany({
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    for (const bot of bots) {
      const hours = bot.activeHours as {
        timezone?: string;
        ranges?: Array<{ start: string; end: string; days: number[] }>;
      };

      const isActive = this.isBotActive(hours, currentHour, currentDay);

      if (isActive) {
        // Add bot to its assigned rooms
        for (const url of bot.activeUrls) {
          const roomHash = `room:${url}`;
          const alreadyInRoom = await this.redis.sismember(
            KEYS.roomUsers(roomHash),
            bot.user.id,
          );

          if (!alreadyInRoom) {
            await Promise.all([
              this.redis.incr(KEYS.roomCount(roomHash)),
              this.redis.sadd(KEYS.roomUsers(roomHash), bot.user.id),
              this.redis.sadd(KEYS.userRooms(bot.user.id), roomHash),
              // Set a longer heartbeat for bots (they don't send real heartbeats)
              this.redis.set(
                KEYS.userHeartbeat(bot.user.id, roomHash),
                Date.now().toString(),
                "EX",
                120,
              ),
            ]);
          } else {
            // Refresh heartbeat
            await this.redis.set(
              KEYS.userHeartbeat(bot.user.id, roomHash),
              Date.now().toString(),
              "EX",
              120,
            );
          }
        }
      } else {
        // Remove bot from all rooms if outside active hours
        const botRooms = await this.redis.smembers(KEYS.userRooms(bot.user.id));
        for (const roomHash of botRooms) {
          const removed = await this.redis.srem(
            KEYS.roomUsers(roomHash),
            bot.user.id,
          );
          if (removed > 0) {
            const count = await this.redis.decr(KEYS.roomCount(roomHash));
            if (count < 0) {
              await this.redis.set(KEYS.roomCount(roomHash), "0");
            }
          }
          await this.redis.del(KEYS.userHeartbeat(bot.user.id, roomHash));
        }
        await this.redis.del(KEYS.userRooms(bot.user.id));
      }
    }
  }

  private isBotActive(
    hours: { ranges?: Array<{ start: string; end: string; days: number[] }> },
    currentHour: number,
    currentDay: number,
  ): boolean {
    if (!hours?.ranges || hours.ranges.length === 0) return true;

    return hours.ranges.some((range) => {
      if (!range.days.includes(currentDay)) return false;
      const startHour = parseInt(range.start.split(":")[0] ?? "0", 10);
      const endHour = parseInt(range.end.split(":")[0] ?? "23", 10);
      return currentHour >= startHour && currentHour < endHour;
    });
  }
}
