import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { findPlan } from "@/constants/plans";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Creates the Client for a signed-in-but-unattached user (clientId: null —
 * only reachable via the onboarding wizard, see src/lib/auth.ts's signIn
 * callback). Client starts in TRIAL status; Stripe's webhook (once
 * configured) is what flips it to ACTIVE. The caller must call
 * useSession().update() after this succeeds so their JWT picks up the new
 * clientId — see the jwt callback's `trigger === "update"` branch.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiFailure("Unauthorized", 401);
  if (user.clientId) return apiFailure("Account is already attached to a tenant", 409);

  try {
    const body = await request.json();
    const name = (body.name || "").toString().trim();
    const planKey = (body.plan_key || "").toString().trim();

    if (!name) return apiFailure("name is required", 400);
    const plan = findPlan(planKey);
    if (!plan) return apiFailure(`Unknown plan_key: ${planKey}`, 400);

    const baseSlug = slugify(name) || "client";
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.client.findUnique({ where: { slug }, select: { id: true } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const client = await prisma.client.create({
      data: { name, slug, status: "TRIAL" },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { clientId: client.id, role: "OWNER" },
    });

    return NextResponse.json({ id: client.id, slug: client.slug, plan_key: plan.key }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create client");
  }
}
