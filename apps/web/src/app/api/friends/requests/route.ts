import { requireAuth, successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [received, sent] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { toId: userId, status: "pending" },
        include: {
          from: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendRequest.findMany({
        where: { fromId: userId, status: "pending" },
        include: {
          to: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return successResponse({ received, sent });
  } catch (error) {
    return errorResponse(error);
  }
}
