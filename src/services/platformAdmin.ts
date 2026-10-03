import { prisma } from "@/lib/prisma";
import { readAutomations } from "@/services/jobHeartbeat";
import { resolvePlan } from "@/services/quota";
import type { JsonObject } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";

const RECENT_LIMIT = 50;
const OVERRIDE_FIELD = "assets_per_month_override";

const iso = (date: Date) => date.toISOString();

export async function listTenants() {
  const [clients, usage] = await Promise.all([
    prisma.client.findMany({
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
    }),
    prisma.usageEvent.groupBy({ by: ["clientId"], _sum: { costUsd: true } }),
  ]);
  const costByClient = new Map(usage.map((row) => [row.clientId, Number(row._sum.costUsd ?? 0)]));

  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    slug: client.slug,
    status: client.status,
    created_at: iso(client.createdAt),
    plan_key: client.subscription?.planKey ?? "starter",
    subscription_status: client.subscription?.status ?? null,
    current_period_end: client.subscription?.currentPeriodEnd?.toISOString() ?? null,
    member_count: client._count.users,
    asset_count: client._count.assets,
    total_cost_usd: costByClient.get(client.id) ?? 0,
  }));
}

export async function listPlatformUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, clientId: true, createdAt: true, client: { select: { name: true, slug: true } } },
  });
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    client_id: user.clientId,
    client_name: user.client?.name ?? null,
    client_slug: user.client?.slug ?? null,
    created_at: iso(user.createdAt),
  }));
}

export async function listPlatformAutomations() {
  const [jobs, schedules] = await Promise.all([
    readAutomations(),
    prisma.postingSchedule.findMany({
      select: { fillerEnabled: true, requireReview: true, client: { select: { id: true, name: true, slug: true, status: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return {
    jobs,
    workspaces: schedules.map((schedule) => ({
      client_id: schedule.client.id,
      name: schedule.client.name,
      slug: schedule.client.slug,
      status: schedule.client.status,
      drafting_on: schedule.fillerEnabled,
      require_review: schedule.requireReview,
    })),
  };
}

export async function getTenantDetail(id: string) {
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
  if (!client) throw notFound("Tenant not found");

  const recent = { where: { clientId: id }, take: RECENT_LIMIT };
  const [pipelineRuns, ideas, assets, blogs] = await Promise.all([
    prisma.pipelineRun.findMany({ ...recent, orderBy: { createdAt: "desc" }, select: { id: true, type: true, status: true, createdAt: true, updatedAt: true } }),
    prisma.idea.findMany({ ...recent, orderBy: { createdAt: "desc" }, select: { id: true, rawIdea: true, status: true, pillar: true, createdAt: true } }),
    prisma.asset.findMany({
      ...recent,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, claimsOk: true, publishedUrls: true, generationCost: true, createdAt: true },
    }),
    prisma.blog.findMany({ ...recent, orderBy: { publishedAt: "desc" }, select: { slug: true, title: true, publishedAt: true } }),
  ]);

  const plan = resolvePlan(client.subscription?.planKey);
  return {
    id: client.id,
    name: client.name,
    slug: client.slug,
    status: client.status,
    timezone: client.timezone,
    created_at: iso(client.createdAt),
    plan_key: plan.key,
    plan_assets_per_month: plan.limits.assetsPerMonth,
    assets_per_month_override: client.assetsPerMonthOverride,
    subscription_status: client.subscription?.status ?? null,
    pipeline_runs: pipelineRuns.map((run) => ({ id: run.id, type: run.type, status: run.status, created_at: iso(run.createdAt), updated_at: iso(run.updatedAt) })),
    ideas: ideas.map((idea) => ({ id: idea.id, raw_idea: idea.rawIdea, status: idea.status, pillar: idea.pillar, created_at: iso(idea.createdAt) })),
    assets: assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      status: asset.status,
      claims_ok: asset.claimsOk,
      published_urls: asset.publishedUrls,
      generation_cost: Number(asset.generationCost),
      created_at: iso(asset.createdAt),
    })),
    blogs: blogs.map((blog) => ({ slug: blog.slug, title: blog.title, published_at: iso(blog.publishedAt) })),
  };
}

export async function setAssetsPerMonthOverride(id: string, body: JsonObject) {
  if (!(OVERRIDE_FIELD in body)) throw badRequest(`${OVERRIDE_FIELD} is required (number or null)`);
  const override = body[OVERRIDE_FIELD] === null ? null : Number(body[OVERRIDE_FIELD]);
  if (override !== null && (!Number.isInteger(override) || override < 0)) {
    throw badRequest(`${OVERRIDE_FIELD} must be a non-negative integer or null`);
  }

  const client = await prisma.client.update({ where: { id }, data: { assetsPerMonthOverride: override }, select: { id: true, assetsPerMonthOverride: true } });
  return { id: client.id, assets_per_month_override: client.assetsPerMonthOverride };
}

export const findClientSummary = (id: string) => prisma.client.findUnique({ where: { id }, select: { id: true, name: true } });
