import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const createCircleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["manual", "auto_detected", "url_based"]).default("manual"),
  isPublic: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const circles = await prisma.circle.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(circles);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await parseBody(req, createCircleSchema);

    const circle = await prisma.circle.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isPublic: data.isPublic,
        createdBy: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
    });

    return successResponse(circle, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
