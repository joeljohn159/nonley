import {
  requireAdmin,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const [userCount, botCount, circleCount, embedSiteCount] =
      await Promise.all([
        prisma.user.count({ where: { isBot: false } }),
        prisma.botProfile.count(),
        prisma.circle.count(),
        prisma.embedSite.count(),
      ]);

    return successResponse({
      users: userCount,
      bots: botCount,
      circles: circleCount,
      embedSites: embedSiteCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
