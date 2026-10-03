import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/server/http/respond";
import { requirePlatformStaff } from "@/lib/tenant";

/**
 * Cross-tenant list for the platform-admin dashboard. Nothing else in the
 * app has this view -- nav-counts/agents/telemetry are all single-tenant-shaped
 * by design (they read requireClientId(), which platform staff can't call
 * without an active view-as-tenant session).
 */
export async function GET() {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        subscription: { select: { planKey: true, status: true, currentPeriodEnd: true } },
        _count: { select: { users: true, assets: true } },
      },
    });

    const usageByClient = await prisma.usageEvent.groupBy({
      by: ["clientId"],
      _sum: { costUsd: true },
    });
    const usageMap = new Map(usageByClient.map((u) => [u.clientId, Number(u._sum.costUsd ?? 0)]));

    const rows = clients.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      created_at: c.createdAt.toISOString(),
      plan_key: c.subscription?.planKey ?? "starter",
      subscription_status: c.subscription?.status ?? null,
      current_period_end: c.subscription?.currentPeriodEnd?.toISOString() ?? null,
      member_count: c._count.users,
      asset_count: c._count.assets,
      total_cost_usd: usageMap.get(c.id) ?? 0,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error, "Failed to load tenants");
  }
}
