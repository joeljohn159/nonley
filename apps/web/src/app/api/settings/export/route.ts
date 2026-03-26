import { NextResponse } from "next/server";

import { requireAuth, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

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
        include: { connected: { select: { name: true, email: true } } },
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
