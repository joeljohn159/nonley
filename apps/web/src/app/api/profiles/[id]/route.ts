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

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountry: z.string().max(100).optional(),
  webTrailPublic: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        profile: true,
        circleMemberships: {
          include: {
            circle: { select: { id: true, name: true, isPublic: true } },
          },
          where: { circle: { isPublic: true } },
        },
      },
    });
    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    if (session.user.id !== params.id) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "You can only edit your own profile",
      );
    }
    const data = await parseBody(req, updateProfileSchema);

    if (data.name) {
      await prisma.user.update({
        where: { id: params.id },
        data: { name: data.name },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _name, ...profileData } = data;
    if (Object.keys(profileData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId: params.id },
        create: { userId: params.id, ...profileData },
        update: profileData,
      });
    }

    return successResponse({ updated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
