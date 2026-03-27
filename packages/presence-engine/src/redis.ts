import Redis from "ioredis";

export function createRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on("connect", () => console.log("[redis] Connected"));
  redis.on("error", (err) => console.error("[redis] Error:", err.message));
  redis.on("reconnecting", () => console.log("[redis] Reconnecting..."));

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

  // Daily counters (expire at midnight UTC)
  dailyWhisperInits: (userId: string, dateStr: string) =>
    `rl:whisper_init:${userId}:${dateStr}`,
  dailyNextSkips: (userId: string, dateStr: string) =>
    `rl:next_skip:${userId}:${dateStr}`,
  dailyGroupCreations: (userId: string, dateStr: string) =>
    `rl:group_create:${userId}:${dateStr}`,

  // Next person state
  nextPersonSession: (chatId: string) => `next:session:${chatId}`,
  nextPersonRecentMatches: (userId: string) => `next:recent:${userId}`,
  nextPersonCooldown: (userId: string) => `next:cooldown:${userId}`,

  // Whisper request pending state
  whisperPending: (chatId: string) => `whisper:pending:${chatId}`,

  // Group chat active in room
  roomGroupChats: (roomHash: string) => `room:${roomHash}:groups`,

  // User's current plan (cached)
  userPlan: (userId: string) => `user:${userId}:plan`,

  // Online status
  userOnline: (userId: string) => `user:${userId}:online`,

  // Active calls
  activeCall: (callId: string) => `call:${callId}`,
} as const;

// ─── Atomic Lua Scripts ─────────────────────────────────────────────
// These prevent race conditions on room count operations.

/**
 * Atomically add a user to a room set and increment the count only if new.
 * Returns 1 if user was newly added, 0 if already present.
 */
const ROOM_JOIN_SCRIPT = `
  local added = redis.call('SADD', KEYS[1], ARGV[1])
  if added == 1 then
    redis.call('INCR', KEYS[2])
  end
  return added
`;

/**
 * Atomically remove a user from a room set and decrement the count only if removed.
 * If count reaches 0, deletes the room keys entirely.
 * Returns the new count, or -1 if user was not in the room.
 */
const ROOM_LEAVE_SCRIPT = `
  local removed = redis.call('SREM', KEYS[1], ARGV[1])
  if removed == 0 then
    return -1
  end
  local count = redis.call('DECR', KEYS[2])
  if count <= 0 then
    redis.call('DEL', KEYS[1], KEYS[2], KEYS[3])
    return 0
  end
  return count
`;

/**
 * Atomic check-and-increment for daily limits.
 * Increments the counter and sets TTL on first use.
 * Returns { current_count, was_allowed } where was_allowed = 1 if under limit.
 */
const RATE_LIMIT_SCRIPT = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  if count > tonumber(ARGV[2]) then
    return {count, 0}
  end
  return {count, 1}
`;

export function defineScripts(redis: Redis): void {
  redis.defineCommand("roomJoin", {
    numberOfKeys: 2,
    lua: ROOM_JOIN_SCRIPT,
  });
  redis.defineCommand("roomLeave", {
    numberOfKeys: 3,
    lua: ROOM_LEAVE_SCRIPT,
  });
  redis.defineCommand("rateLimit", {
    numberOfKeys: 1,
    lua: RATE_LIMIT_SCRIPT,
  });
}

// Type extensions for custom commands
declare module "ioredis" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface RedisCommander<Context> {
    roomJoin(
      roomUsersKey: string,
      roomCountKey: string,
      userId: string,
      callback?: (err: Error | null, result: number) => void,
    ): Promise<number>;
    roomLeave(
      roomUsersKey: string,
      roomCountKey: string,
      roomGroupsKey: string,
      userId: string,
      callback?: (err: Error | null, result: number) => void,
    ): Promise<number>;
    rateLimit(
      key: string,
      ttlSeconds: string,
      maxCount: string,
      callback?: (err: Error | null, result: [number, number]) => void,
    ): Promise<[number, number]>;
  }
}

/**
 * Type-safe wrappers for custom Lua commands.
 * Eliminates unsafe `as never as` casts throughout the codebase.
 */
export const commands = {
  async roomJoin(
    redis: Redis,
    roomHash: string,
    userId: string,
  ): Promise<number> {
    return (
      redis as Redis & { roomJoin: (...args: string[]) => Promise<number> }
    ).roomJoin(KEYS.roomUsers(roomHash), KEYS.roomCount(roomHash), userId);
  },

  async roomLeave(
    redis: Redis,
    roomHash: string,
    userId: string,
  ): Promise<number> {
    return (
      redis as Redis & { roomLeave: (...args: string[]) => Promise<number> }
    ).roomLeave(
      KEYS.roomUsers(roomHash),
      KEYS.roomCount(roomHash),
      KEYS.roomGroupChats(roomHash),
      userId,
    );
  },

  async rateLimit(
    redis: Redis,
    key: string,
    ttlSeconds: number,
    maxCount: number,
  ): Promise<{ count: number; allowed: boolean }> {
    const [count, allowed] = await (
      redis as Redis & {
        rateLimit: (...args: string[]) => Promise<[number, number]>;
      }
    ).rateLimit(key, ttlSeconds.toString(), maxCount.toString());
    return { count, allowed: allowed === 1 };
  },
};

/**
 * Safely parse JSON from Redis. Returns null on failure instead of throwing.
 */
export function safeParseJson<T>(data: string | null): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    console.error("[redis] Failed to parse JSON:", data.slice(0, 100));
    return null;
  }
}
