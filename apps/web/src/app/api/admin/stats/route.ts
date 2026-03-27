import {
  requireAdmin,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();

    const [userCount, circleCount, embedSiteCount] = await Promise.all([
      prisma.user.count(),
      prisma.circle.count(),
      prisma.embedSite.count(),
    ]);

    return successResponse({
      users: userCount,
      circles: circleCount,
      embedSites: embedSiteCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
