import { NextResponse } from "next/server";
import { apiError } from "@/server/http/respond";
import { requirePlatformStaff } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { readAutomations } from "@/services/jobHeartbeat";

/**
 * Platform-wide view of the background jobs: each one's state from its last
 * check-in, plus which workspaces have automatic drafting and review on.
 */
export async function GET() {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  try {
    const [jobs, schedules] = await Promise.all([
      readAutomations(),
      prisma.postingSchedule.findMany({
        select: { fillerEnabled: true, requireReview: true, client: { select: { id: true, name: true, slug: true, status: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return NextResponse.json({
      jobs,
      workspaces: schedules.map((s) => ({
        client_id: s.client.id,
        name: s.client.name,
        slug: s.client.slug,
        status: s.client.status,
        drafting_on: s.fillerEnabled,
        require_review: s.requireReview,
      })),
    });
  } catch (e) {
    return apiError(e, "Could not load automations");
  }
}
