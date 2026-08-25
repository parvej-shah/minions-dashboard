import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requirePlatformStaff } from "@/lib/tenant";
import { findPlan } from "@/constants/plans";

const RECENT_LIMIT = 50;

/**
 * One tenant's cross-cutting activity + generation history, for the
 * platform-admin drill-down -- "what are they doing" (PipelineRun history)
 * and "what are they generating" (recent ideas/assets/blogs). Bounded to the
 * most recent RECENT_LIMIT of each; these models already have @@index([clientId]).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        timezone: true,
        assetsPerMonthOverride: true,
        createdAt: true,
        subscription: { select: { planKey: true, status: true, currentPeriodEnd: true } },
      },
    });
    if (!client) return apiFailure("Tenant not found", 404);

    const [pipelineRuns, ideas, assets, blogs] = await Promise.all([
      prisma.pipelineRun.findMany({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
        select: { id: true, type: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.idea.findMany({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
        select: { id: true, rawIdea: true, status: true, pillar: true, createdAt: true },
      }),
      prisma.asset.findMany({
        where: { clientId: id },
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
        select: {
          id: true,
          title: true,
          status: true,
          claimsOk: true,
          publishedUrls: true,
          generationCost: true,
          createdAt: true,
        },
      }),
      prisma.blog.findMany({
        where: { clientId: id },
        orderBy: { publishedAt: "desc" },
        take: RECENT_LIMIT,
        select: { slug: true, title: true, publishedAt: true },
      }),
    ]);

    const plan = findPlan(client.subscription?.planKey ?? "starter") ?? findPlan("starter")!;

    return NextResponse.json({
      id: client.id,
      name: client.name,
      slug: client.slug,
      status: client.status,
      timezone: client.timezone,
      created_at: client.createdAt.toISOString(),
      plan_key: plan.key,
      plan_assets_per_month: plan.limits.assetsPerMonth,
      assets_per_month_override: client.assetsPerMonthOverride,
      subscription_status: client.subscription?.status ?? null,
      pipeline_runs: pipelineRuns.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
      ideas: ideas.map((i) => ({
        id: i.id,
        raw_idea: i.rawIdea,
        status: i.status,
        pillar: i.pillar,
        created_at: i.createdAt.toISOString(),
      })),
      assets: assets.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        claims_ok: a.claimsOk,
        published_urls: a.publishedUrls,
        generation_cost: Number(a.generationCost),
        created_at: a.createdAt.toISOString(),
      })),
      blogs: blogs.map((b) => ({
        slug: b.slug,
        title: b.title,
        published_at: b.publishedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error, "Failed to load tenant detail");
  }
}

/** Maintainer-only field(s) editable from the platform-admin dashboard -- see Client.assetsPerMonthOverride. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePlatformStaff();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;

  try {
    const body = await request.json();
    if (!("assets_per_month_override" in body)) {
      return apiFailure("assets_per_month_override is required (number or null)", 400);
    }

    const raw = body.assets_per_month_override;
    const override = raw === null ? null : Number(raw);
    if (override !== null && (!Number.isInteger(override) || override < 0)) {
      return apiFailure("assets_per_month_override must be a non-negative integer or null", 400);
    }

    const client = await prisma.client.update({
      where: { id },
      data: { assetsPerMonthOverride: override },
      select: { id: true, assetsPerMonthOverride: true },
    });

    return NextResponse.json({ id: client.id, assets_per_month_override: client.assetsPerMonthOverride });
  } catch (error) {
    return apiError(error, "Failed to update tenant");
  }
}
