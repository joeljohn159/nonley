import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
  ApiError,
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
  urlContext: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const data = await parseBody(req, waveSchema);

    if (data.toUserId === userId) {
      throw new ApiError(400, "INVALID_TARGET", "Cannot wave at yourself");
    }

    // Prevent duplicate waves to the same person
    const existingWave = await prisma.wave.findFirst({
      where: { fromUser: userId, toUser: data.toUserId },
    });
    if (existingWave) {
      throw new ApiError(
        409,
        "DUPLICATE_WAVE",
        "You already waved at this person",
      );
    }

    const wave = await prisma.wave.create({
      data: {
        fromUser: userId,
        toUser: data.toUserId,
        urlContext: data.urlContext,
      },
    });

    // Auto-create connection if mutual wave exists (use skipDuplicates for race safety)
    const mutualWave = await prisma.wave.findFirst({
      where: { fromUser: data.toUserId, toUser: userId },
    });

    if (mutualWave) {
      await prisma.connection.createMany({
        data: [
          { userId, connectedTo: data.toUserId },
          { userId: data.toUserId, connectedTo: userId },
        ],
        skipDuplicates: true,
      });
    }

    return successResponse(wave, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
