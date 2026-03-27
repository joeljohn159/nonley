import { NextRequest, NextResponse } from "next/server";

import { requireAuth, successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// Simple in-memory rate limiter for lookup (10 lookups per minute per user)
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();

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
    if (!email || !email.includes("@")) {
      return errorResponse(new Error("Valid email is required"));
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!user) {
      return errorResponse(new Error("User not found"));
    }

    if (user.id === userId) {
      return errorResponse(new Error("Cannot look up yourself"));
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
