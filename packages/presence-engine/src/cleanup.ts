import type Redis from "ioredis";

import { KEYS, commands } from "./redis";

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
    let scannedUsers = 0;
    let removedStale = 0;

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
          scannedUsers++;

          try {
            const rooms = await redis.smembers(userRoomsKey);
            for (const roomHash of rooms) {
              const heartbeatKey = KEYS.userHeartbeat(userId, roomHash);
              const exists = await redis.exists(heartbeatKey);

              if (!exists) {
                // Heartbeat expired — use atomic Lua script to clean up
                console.log(
                  `[cleanup] Removing stale user ${userId} from room ${roomHash}`,
                );

                await commands.roomLeave(redis, roomHash, userId);
                await redis.srem(KEYS.userRooms(userId), roomHash);
                removedStale++;
              }
            }
          } catch (userErr) {
            // Isolate per-user failures so one bad state doesn't block the rest
            console.error(
              `[cleanup] Failed to clean up user ${userId}:`,
              userErr,
            );
          }
        }
      } while (cursor !== "0");

      if (removedStale > 0) {
        console.log(
          `[cleanup] Cycle complete: scanned=${scannedUsers} removed=${removedStale}`,
        );
      }
    } catch (err) {
      console.error("[cleanup] Error during heartbeat cleanup:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
