import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const connections = await prisma.connection.findMany({
      where: { userId: session.user.id },
      include: {
        connected: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return successResponse(connections);
  } catch (error) {
    return errorResponse(error);
  }
}

const waveSchema = z.object({
  toUserId: z.string().uuid(),
  urlContext: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await parseBody(req, waveSchema);

    const wave = await prisma.wave.create({
      data: {
        fromUser: session.user.id,
        toUser: data.toUserId,
        urlContext: data.urlContext,
      },
    });

    // Auto-create connection if mutual wave exists
    const mutualWave = await prisma.wave.findFirst({
      where: { fromUser: data.toUserId, toUser: session.user.id },
    });

    if (mutualWave) {
      await prisma.connection.createMany({
        data: [
          { userId: session.user.id, connectedTo: data.toUserId },
          { userId: data.toUserId, connectedTo: session.user.id },
        ],
        skipDuplicates: true,
      });
    }

    return successResponse(wave, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
