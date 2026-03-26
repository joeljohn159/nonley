import Redis from "ioredis";

export function createRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  redis.on("connect", () => console.log("[redis] Connected"));
  redis.on("error", (err) => console.error("[redis] Error:", err.message));

  return redis;
}

// Key patterns for Redis
export const KEYS = {
  roomCount: (roomHash: string) => `room:${roomHash}:count`,
  roomUsers: (roomHash: string) => `room:${roomHash}:users`,
  userRooms: (userId: string) => `user:${userId}:rooms`,
  userHeartbeat: (userId: string, roomHash: string) =>
    `hb:${userId}:${roomHash}`,
  userFriends: (userId: string) => `user:${userId}:friends`,
  rateLimitReaction: (userId: string) => `rl:reaction:${userId}`,
  rateLimitWhisper: (userId: string) => `rl:whisper:${userId}`,
  rateLimitRoomChat: (roomHash: string) => `rl:roomchat:${roomHash}`,
} as const;
