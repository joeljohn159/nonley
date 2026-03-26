import { NextRequest } from "next/server";
import { z } from "zod";

import {
  requireAuth,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const updateSettingsSchema = z.object({
  privacyDefault: z
    .enum(["ghost", "anonymous", "circles_only", "open"])
    .optional(),
  focusMode: z.boolean().optional(),
  name: z.string().min(1).max(50).optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        privacyDefault: true,
        focusMode: true,
        plan: true,
        profile: true,
        integrations: { select: { provider: true, connectedAt: true } },
      },
    });
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await parseBody(req, updateSettingsSchema);

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return successResponse({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
