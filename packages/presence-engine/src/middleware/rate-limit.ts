import type { Socket } from "socket.io";

/**
 * Per-socket event rate limiter.
 * Prevents abuse of WebSocket events (message spam, rapid join/leave, etc.)
 * Uses a sliding window counter per socket per event type.
 */

interface RateLimitConfig {
  /** Max events allowed in the window */
  maxEvents: number;
  /** Time window in milliseconds */
  windowMs: number;
}

const EVENT_LIMITS: Record<string, RateLimitConfig> = {
  // Chat messages: 30 per minute
  send_room_chat: { maxEvents: 30, windowMs: 60_000 },
  send_group_chat: { maxEvents: 30, windowMs: 60_000 },
  send_friend_message: { maxEvents: 30, windowMs: 60_000 },

  // Presence: 10 per minute (shouldn't fire faster than heartbeat)
  join_room: { maxEvents: 10, windowMs: 60_000 },
  leave_room: { maxEvents: 10, windowMs: 60_000 },
  heartbeat: { maxEvents: 5, windowMs: 60_000 },

  // Initiation actions: strict limits
  initiate_whisper: { maxEvents: 5, windowMs: 60_000 },
  next_person: { maxEvents: 10, windowMs: 60_000 },
  create_group_chat: { maxEvents: 3, windowMs: 60_000 },
  send_friend_request: { maxEvents: 10, windowMs: 60_000 },
  call_user: { maxEvents: 5, windowMs: 60_000 },

  // Reactions: 10 per minute
  send_reaction: { maxEvents: 10, windowMs: 60_000 },
};

interface WindowEntry {
  timestamps: number[];
}

/**
 * Creates a rate-limiting middleware wrapper for socket events.
 * Wraps the `socket.on` to intercept and rate-limit events.
 */
export function applyRateLimiting(socket: Socket): void {
  const windows = new Map<string, WindowEntry>();

  const originalOn = socket.on.bind(socket);

  // Override socket.on to wrap handlers with rate limiting
  socket.on = function (event: string, listener: (...args: unknown[]) => void) {
    const config = EVENT_LIMITS[event];

    if (!config) {
      // No rate limit for this event — pass through
      return originalOn(event, listener);
    }

    return originalOn(event, (...args: unknown[]) => {
      const now = Date.now();
      let entry = windows.get(event);
      if (!entry) {
        entry = { timestamps: [] };
        windows.set(event, entry);
      }

      // Slide window: remove timestamps outside window
      const cutoff = now - config.windowMs;
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

      if (entry.timestamps.length >= config.maxEvents) {
        // Rate limited — silently drop
        return;
      }

      entry.timestamps.push(now);
      listener(...args);
    });
  } as typeof socket.on;

  // Clean up on disconnect
  socket.on("disconnect", () => {
    windows.clear();
  });
}
