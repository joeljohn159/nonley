import "dotenv/config";
import { createServer } from "node:http";

import { validateEnv, CORS_ALLOWED_ORIGINS } from "@nonley/config";
import type { ServerToClientEvents, ClientToServerEvents } from "@nonley/types";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import { startHeartbeatCleanup } from "./cleanup";
import { createCallHandler } from "./handlers/calls";
import { createChatHandler } from "./handlers/chat";
import { createFriendsHandler } from "./handlers/friends";
import { createLimitsHandler } from "./handlers/limits";
import { createNextPersonHandler } from "./handlers/next-person";
import { createPresenceHandler } from "./handlers/presence";
import { authenticateSocket } from "./middleware/auth";
import { applyRateLimiting } from "./middleware/rate-limit";
import { createRedisClient, defineScripts } from "./redis";

const PORT = parseInt(process.env.PRESENCE_ENGINE_PORT ?? "3001", 10);

async function main() {
  validateEnv();

  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  const redis = createRedisClient();
  defineScripts(redis);

  const httpServer = createServer((req, res) => {
    // Health check endpoint with metrics
    if (req.url === "/health" && req.method === "GET") {
      const connectedSockets = io?.engine?.clientsCount ?? 0;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          connections: connectedSockets,
          uptime: Math.floor(process.uptime()),
          memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
        }),
      );
      return;
    }

    // Readiness check - verify dependencies
    if (req.url === "/ready" && req.method === "GET") {
      Promise.all([prisma.$queryRaw`SELECT 1`, redis.ping()])
        .then(() => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ready" }));
        })
        .catch((err) => {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "not ready", error: String(err) }));
        });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const corsOrigins: string[] = [...CORS_ALLOWED_ORIGINS];
  if (process.env.NODE_ENV !== "production") {
    corsOrigins.push("http://localhost:3000", "http://localhost:5173");
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingInterval: 30000,
      pingTimeout: 90000,
    },
  );

  // Authenticate all incoming connections
  io.use(authenticateSocket);

  // Handle connections
  io.on("connection", (socket) => {
    // Apply per-socket rate limiting before registering handlers
    applyRateLimiting(socket);

    const handler = createPresenceHandler(io, socket, redis, prisma);
    const chatHandler = createChatHandler(io, socket, redis, prisma);
    const nextPersonHandler = createNextPersonHandler(
      io,
      socket,
      redis,
      prisma,
    );
    const limitsHandler = createLimitsHandler(io, socket, redis, prisma);
    const friendsHandler = createFriendsHandler(io, socket, redis, prisma);
    const callHandler = createCallHandler(io, socket, redis, prisma);

    // Presence
    socket.on("join_room", handler.onJoinRoom);
    socket.on("leave_room", handler.onLeaveRoom);
    socket.on("heartbeat", handler.onHeartbeat);
    socket.on("send_reaction", handler.onSendReaction);
    socket.on("send_whisper", handler.onSendWhisper);
    socket.on("send_room_chat", handler.onSendRoomChat);
    socket.on("toggle_focus", handler.onToggleFocus);
    socket.on("disconnect", handler.onDisconnect);

    // 1-1 Whisper lifecycle
    socket.on("initiate_whisper", chatHandler.onInitiateWhisper);
    socket.on("accept_whisper", chatHandler.onAcceptWhisper);
    socket.on("decline_whisper", chatHandler.onDeclineWhisper);

    // Group chat
    socket.on("create_group_chat", chatHandler.onCreateGroupChat);
    socket.on("join_group_chat", chatHandler.onJoinGroupChat);
    socket.on("leave_group_chat", chatHandler.onLeaveGroupChat);
    socket.on("send_group_chat", chatHandler.onSendGroupChat);
    socket.on("list_group_chats", chatHandler.onListGroupChats);

    // Next person
    socket.on("next_person", nextPersonHandler.onNextPerson);
    socket.on("end_next_person", nextPersonHandler.onEndNextPerson);

    // Limits
    socket.on("get_chat_limits", limitsHandler.onGetChatLimits);

    // Friends
    socket.on("send_friend_request", friendsHandler.onSendFriendRequest);
    socket.on("accept_friend_request", friendsHandler.onAcceptFriendRequest);
    socket.on("decline_friend_request", friendsHandler.onDeclineFriendRequest);
    socket.on("remove_friend", friendsHandler.onRemoveFriend);
    socket.on("send_friend_message", friendsHandler.onSendFriendMessage);
    socket.on("get_friends", friendsHandler.onGetFriends);
    socket.on("get_friend_requests", friendsHandler.onGetFriendRequests);

    // Calls
    socket.on("call_user", callHandler.onCallUser);
    socket.on("accept_call", callHandler.onAcceptCall);
    socket.on("decline_call", callHandler.onDeclineCall);
    socket.on("end_call", callHandler.onEndCall);
    socket.on("send_call_signal", callHandler.onSendCallSignal);

    console.log(
      `[presence] Connected: user=${socket.data.userId} transport=${socket.conn.transport.name}`,
    );

    friendsHandler.trackOnline();
    socket.on("disconnect", (reason) => {
      console.log(
        `[presence] Disconnected: user=${socket.data.userId} reason=${reason}`,
      );
      friendsHandler.trackOffline();
    });
  });

  // Start stale heartbeat cleanup
  const cleanupInterval = startHeartbeatCleanup(redis);

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[presence] Received ${signal}, shutting down gracefully...`);

    clearInterval(cleanupInterval);

    // Close all socket connections
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      s.disconnect(true);
    }

    io.close();
    httpServer.close();
    redis.disconnect();
    await prisma.$disconnect();

    console.log("[presence] Shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  httpServer.listen(PORT, () => {
    console.log(`[presence] Presence engine running on port ${PORT}`);
    console.log(`[presence] Health check: http://localhost:${PORT}/health`);
  });
}

// Catch unhandled rejections (e.g. from setTimeout async callbacks in handlers)
// so they don't crash the process in production
process.on("unhandledRejection", (reason) => {
  console.error("[presence] Unhandled promise rejection:", reason);
});

main().catch((err) => {
  console.error("[presence] Fatal error:", err);
  process.exit(1);
});
