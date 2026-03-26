import type Redis from "ioredis";

import { KEYS } from "./redis";

/**
 * Periodically scans for users whose heartbeats have expired
 * and cleans up their room presence data.
 * Returns the interval ID for cleanup on shutdown.
 */
export function startHeartbeatCleanup(
  redis: Redis,
): ReturnType<typeof setInterval> {
  const CLEANUP_INTERVAL_MS = 60_000; // Check every minute

  return setInterval(async () => {
    try {
      // Scan all user:*:rooms keys to find users with rooms
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          "user:*:rooms",
          "COUNT",
          100,
        );
        cursor = nextCursor;

        for (const userRoomsKey of keys) {
          // Extract userId from key pattern "user:{userId}:rooms"
          const userId = userRoomsKey.split(":")[1];
          if (!userId) continue;

          const rooms = await redis.smembers(userRoomsKey);
          for (const roomHash of rooms) {
            const heartbeatKey = KEYS.userHeartbeat(userId, roomHash);
            const exists = await redis.exists(heartbeatKey);

            if (!exists) {
              // Heartbeat expired - clean up this user from this room
              console.log(
                `[cleanup] Removing stale user ${userId} from room ${roomHash}`,
              );
              await Promise.all([
                redis.srem(KEYS.roomUsers(roomHash), userId),
                redis.srem(KEYS.userRooms(userId), roomHash),
              ]);
              // Decrement count, but never below 0
              const count = await redis.decr(KEYS.roomCount(roomHash));
              if (count < 0) {
                await redis.set(KEYS.roomCount(roomHash), "0");
              }
            }
          }
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("[cleanup] Error during heartbeat cleanup:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
