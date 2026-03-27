import { NextRequest, NextResponse } from "next/server";

import {
  requireAuth,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// In-memory rate limiter for lookup (10 lookups per minute per user)
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();

// Prevent unbounded memory growth: evict expired entries periodically
const CLEANUP_INTERVAL_MS = 5 * 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of lookupAttempts) {
    if (now > entry.resetAt) {
      lookupAttempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = lookupAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    lookupAttempts.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many lookups. Try again later.",
          },
        },
        { status: 429 },
      );
    }

    const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
    if (!email || !email.includes("@") || email.length > 320) {
      throw new ApiError(400, "INVALID_EMAIL", "Valid email is required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, avatarUrl: true },
    });

    // Return the same shape whether user exists or not to prevent email enumeration.
    // The client should handle null userId gracefully.
    if (!user || user.id === userId) {
      return successResponse(null);
    }

    return successResponse({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
