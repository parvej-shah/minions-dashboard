import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPipelineFleet } from "@/services/agents";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import type { NavCounts } from "@/types";

/**
 * Sidebar badge counts in one round trip.
 *
 * The dashboard shell previously fetched /api/ideas, /api/assets,
 * /api/published, /api/brand/directives and /api/agents in parallel on every
 * navigation and counted the rows in the browser.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [ideasReady, pendingReview, publishedLive, directivesCount, fleet] =
      await Promise.all([
        prisma.idea.count({
          where: { clientId: ctx.clientId, status: { in: ["HARVESTED", "REFINED"] } },
        }),
        prisma.asset.count({ where: { clientId: ctx.clientId, status: "PENDING_REVIEW" } }),
        prisma.blog.count({ where: { clientId: ctx.clientId } }),
        prisma.brandDirective.count({ where: { clientId: ctx.clientId } }),
        getPipelineFleet(ctx.clientId).catch(() => []),
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
