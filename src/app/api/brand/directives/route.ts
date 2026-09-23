import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { refuseOnboardingOverwrite } from "@/lib/onboardingGuard";
import { resolveAudienceScope, RETIRED_SCOPE_MESSAGE } from "@/constants/audience";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const rows = await prisma.brandDirective.findMany({
      where: { clientId: ctx.clientId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rows.map(toDirectiveDTO));
  } catch (error) {
    return apiError(error, "Failed to fetch brand directives");
  }
}

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    // Shared with the Brand/Settings pages; only the onboarding wizard's writes
    // (flagged from_onboarding) are refused for an established workspace.
    if (body.from_onboarding === true) {
      const refused = await refuseOnboardingOverwrite(ctx.clientId);
      if (refused) return refused;
    }
    if (!body.category || !body.key || !body.content) {
      return apiFailure("category, key, and content are required", 400);
    }
    const audienceScope = resolveAudienceScope(body.audience_scope);
    if (!audienceScope) return apiFailure(RETIRED_SCOPE_MESSAGE, 400);

    const isForbidden = body.category === "FORBIDDEN";
    const PER_CATEGORY_LIMIT = 6;

    if (!isForbidden) {
      const categoryCount = await prisma.brandDirective.count({
        where: {
          clientId: ctx.clientId,
          category: body.category,
          isActive: true,
        },
      });

      if (categoryCount >= PER_CATEGORY_LIMIT) {
        return apiFailure(
          `You have reached the limit of ${PER_CATEGORY_LIMIT} active directives for "${body.category}". Please edit or remove existing directives in this category.`,
          400
        );
      }
    }

    // Generate unique ID without collision risks
    const uniqueId = `DIR-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

    const created = await prisma.brandDirective.create({
      data: {
        id: uniqueId,
        clientId: ctx.clientId,
        category: body.category,
        ruleKey: String(body.key).toLowerCase().replace(/\s+/g, "_"),
        instruction: String(body.content).trim(),
        priority: body.priority || 1,
        audienceScope,
        isActive: true,
      },
    });

    return NextResponse.json(toDirectiveDTO(created), { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create brand directive");
  }
}
