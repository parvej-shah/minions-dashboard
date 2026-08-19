import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPipelineFleet } from "@/services/agents";
import { apiError } from "@/lib/api-response";
import type { NavCounts } from "@/types";

/**
 * Sidebar badge counts in one round trip.
 *
 * The dashboard shell previously fetched /api/ideas, /api/assets,
 * /api/published, /api/brand/directives and /api/agents in parallel on every
 * navigation and counted the rows in the browser.
 */
export async function GET() {
  try {
    const [ideasReady, pendingReview, publishedLive, directivesCount, fleet] =
      await Promise.all([
        prisma.idea.count({ where: { status: { in: ["HARVESTED", "REFINED"] } } }),
        prisma.asset.count({ where: { status: "PENDING_REVIEW" } }),
        prisma.blog.count(),
        prisma.brandDirective.count(),
        getPipelineFleet().catch(() => []),
      ]);

    const counts: NavCounts = {
      ideasReady,
      pendingReview,
      publishedLive,
      directivesCount,
      activeAgents: fleet.filter((a) => a.status === "ACTIVE").length,
    };

    return NextResponse.json(counts);
  } catch (error) {
    return apiError(error, "Failed to fetch nav counts");
  }
}
