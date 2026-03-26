import "dotenv/config";
import { createServer } from "node:http";

import { validateEnv, CORS_ALLOWED_ORIGINS } from "@nonley/config";
import type { ServerToClientEvents, ClientToServerEvents } from "@nonley/types";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

import { BotScheduler } from "./bot-scheduler";
import { startHeartbeatCleanup } from "./cleanup";
import { createPresenceHandler } from "./handlers/presence";
import { authenticateSocket } from "./middleware/auth";
import { createRedisClient } from "./redis";

const PORT = parseInt(process.env.PRESENCE_ENGINE_PORT ?? "3001", 10);

async function main() {
  validateEnv();

  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log("[db] Connected to PostgreSQL");

  const redis = createRedisClient();

  const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
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

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: [
          ...CORS_ALLOWED_ORIGINS,
          "http://localhost:3000",
          "http://localhost:5173",
        ],
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
    const handler = createPresenceHandler(io, socket, redis, prisma);

    socket.on("join_room", handler.onJoinRoom);
    socket.on("leave_room", handler.onLeaveRoom);
    socket.on("heartbeat", handler.onHeartbeat);
    socket.on("send_reaction", handler.onSendReaction);
    socket.on("send_whisper", handler.onSendWhisper);
    socket.on("send_room_chat", handler.onSendRoomChat);
    socket.on("toggle_focus", handler.onToggleFocus);
    socket.on("disconnect", handler.onDisconnect);

    console.log(`[presence] User connected: ${socket.data.userId}`);
  });

  // Start bot scheduler
  const botScheduler = new BotScheduler(io, redis, prisma);
  botScheduler.start();

  // Start stale heartbeat cleanup
  const cleanupInterval = startHeartbeatCleanup(redis);

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[presence] Received ${signal}, shutting down gracefully...`);

    botScheduler.stop();
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

main().catch((err) => {
  console.error("[presence] Fatal error:", err);
  process.exit(1);
});
