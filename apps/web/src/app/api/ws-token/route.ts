import jwt from "jsonwebtoken";

import {
  requireAuth,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await requireAuth();

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new ApiError(
        500,
        "CONFIG_ERROR",
        "Server authentication is misconfigured",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User account not found");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
      },
      secret,
      { expiresIn: "24h" },
    );

    return successResponse({ token });
  } catch (error) {
    return errorResponse(error);
  }
}
