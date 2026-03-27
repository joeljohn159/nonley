import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";

interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan?: string;
}

export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return next(new Error("Server configuration error"));
    }

    const payload = jwt.verify(token, secret) as TokenPayload;

    if (!payload.userId || typeof payload.userId !== "string") {
      return next(new Error("Invalid token: missing userId"));
    }

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;
    socket.data.userName = payload.name ?? null;
    socket.data.userAvatar = payload.avatarUrl ?? null;
    socket.data.plan = payload.plan ?? "free";
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
