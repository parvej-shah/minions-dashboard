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
 * callback). No billing is wired up yet, so the Client goes straight to
 * ACTIVE — plan_key is only validated here (must be a real PLANS entry),
 * not persisted anywhere yet; a real billing integration will need its own
 * Subscription row keyed by plan_key when that lands. The caller must call
 * useSession().update()
 * after this succeeds so their JWT picks up the new clientId — see the jwt
 * callback's `trigger === "update"` branch.
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
      data: { name, slug, status: "ACTIVE" },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { clientId: client.id, role: "OWNER" },
      }),
      // The owner's own ClientMembership row -- keeps them consistent with
      // anyone invited later (see /api/team/invite), so /api/team lists them
      // as a member of their own tenant and the workspace switcher (Phase
      // 4.5) can find every client a user belongs to from one table.
      prisma.clientMembership.create({
        data: {
          userId: user.id,
          email: user.email,
          clientId: client.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ id: client.id, slug: client.slug, plan_key: plan.key }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create client");
  }
}
