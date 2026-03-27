import type Redis from "ioredis";

import { KEYS } from "./redis";

/**
 * Periodically scans for users whose heartbeats have expired
 * and atomically cleans up their room presence data.
 * Returns the interval ID for cleanup on shutdown.
 */
export function startHeartbeatCleanup(
  redis: Redis,
): ReturnType<typeof setInterval> {
  const CLEANUP_INTERVAL_MS = 60_000;

  return setInterval(async () => {
    try {
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
          const userId = userRoomsKey.split(":")[1];
          if (!userId) continue;

          const rooms = await redis.smembers(userRoomsKey);
          for (const roomHash of rooms) {
            const heartbeatKey = KEYS.userHeartbeat(userId, roomHash);
            const exists = await redis.exists(heartbeatKey);

            if (!exists) {
              // Heartbeat expired — use atomic Lua script to clean up
              console.log(
                `[cleanup] Removing stale user ${userId} from room ${roomHash}`,
              );

              await (
                redis as never as {
                  roomLeave: (
                    a: string,
                    b: string,
                    c: string,
                    d: string,
                  ) => Promise<number>;
                }
              ).roomLeave(
                KEYS.roomUsers(roomHash),
                KEYS.roomCount(roomHash),
                KEYS.roomGroupChats(roomHash),
                userId,
              );

              await redis.srem(KEYS.userRooms(userId), roomHash);
            }
          }
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("[cleanup] Error during heartbeat cleanup:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
