import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/security";

export async function POST(request: Request) {
  const authCheck = verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    
    // Generate or use passed ID
    let ideaId = body.ideaId || body.id;
    if (!ideaId) {
      const count = await prisma.idea.count();
      ideaId = `IDEA-${String(count + 1).padStart(4, "0")}`;
    }

    const created = await prisma.idea.upsert({
      where: { id: ideaId },
      update: {
        rawIdea: body.title || body.raw_idea || body.rawIdea || "Untitled Signal",
        angle: body.angle || body.excerpt || "Strategic trade thesis",
        targetTrade: body.trade || body.target_trade || body.targetTrade || "HVAC",
        audience: body.audience || "ICP",
        pillar: body.pillar || "Contractor Realities",
        source: body.source || "GOOGLE_TRENDS",
        status: body.status || "HARVESTED",
        priority: body.priority || "HIGH",
        tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : []
      },
      create: {
        id: ideaId,
        rawIdea: body.title || body.raw_idea || body.rawIdea || "Untitled Signal",
        angle: body.angle || body.excerpt || "Strategic trade thesis",
        targetTrade: body.trade || body.target_trade || body.targetTrade || "HVAC",
        audience: body.audience || "ICP",
        pillar: body.pillar || "Contractor Realities",
        source: body.source || "GOOGLE_TRENDS",
        status: "HARVESTED",
        priority: body.priority || "HIGH",
        tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : [],
        icpRelevance: 90
      }
    });

    return NextResponse.json({ success: true, idea: created }, { status: 201 });
  } catch (error) {
    return apiError(error, "Webhook processing failed");
  }
}
