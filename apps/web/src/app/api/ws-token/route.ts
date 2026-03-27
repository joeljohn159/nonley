import jwt from "jsonwebtoken";

import { requireAuth, successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await requireAuth();

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

    if (!user) return errorResponse(new Error("User not found"));

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "24h" },
    );

    return successResponse({ token });
  } catch (error) {
    return errorResponse(error);
  }
}
