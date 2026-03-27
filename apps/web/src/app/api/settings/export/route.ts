import { NextResponse } from "next/server";

import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// Rate limit: 1 export per 5 minutes per user
const exportTimestamps = new Map<string, number>();

// Clean up stale entries periodically
const CLEANUP_INTERVAL_MS = 10 * 60_000;
setInterval(() => {
  const cutoff = Date.now() - 5 * 60_000;
  for (const [key, ts] of exportTimestamps) {
    if (ts < cutoff) {
      exportTimestamps.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Enforce rate limit
    const lastExport = exportTimestamps.get(userId);
    if (lastExport && Date.now() - lastExport < 5 * 60_000) {
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "You can only export data once every 5 minutes",
      );
    }
    exportTimestamps.set(userId, Date.now());

    const [user, connections, waves, circles, savedChats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          privacyDefault: true,
          plan: true,
          profile: true,
        },
      }),
      prisma.connection.findMany({
        where: { userId },
        include: { connected: { select: { name: true } } },
      }),
      prisma.wave.findMany({
        where: { OR: [{ fromUser: userId }, { toUser: userId }] },
      }),
      prisma.circleMember.findMany({
        where: { userId },
        include: { circle: true },
      }),
      prisma.microChat.findMany({
        where: { savedBy: { has: userId } },
        include: { messages: true },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      connections,
      waves,
      circles: circles.map((m: (typeof circles)[number]) => m.circle),
      savedChats,
    };

    console.log(`[export] Data exported: user=${userId}`);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nonley-export-${userId}.json"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
