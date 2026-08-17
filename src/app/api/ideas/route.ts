import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IdeaItem } from "@/lib/types";

export async function GET() {
  try {
    const dbIdeas = await prisma.idea.findMany({
      orderBy: { createdAt: "desc" }
    });

    if (dbIdeas.length > 0) {
      const formatted: IdeaItem[] = dbIdeas.map((idea) => ({
        id: idea.id,
        ideaId: idea.id,
        title: idea.rawIdea,
        raw_idea: idea.rawIdea,
        excerpt: idea.angle || idea.why || "Strategic angle for editorial development.",
        angle: idea.angle || "",
        audience: (idea.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
        target_trade: idea.targetTrade,
        pillar: idea.pillar,
        source: (idea.source || "MANUAL") as any,
        tags: idea.tags || [],
        status: (idea.status || "HARVESTED") as any,
        estimated_cost: 0.038,
        created_at: idea.createdAt.toISOString(),
        updated_at: idea.updatedAt.toISOString(),
      }));
      return NextResponse.json(formatted);
    }
    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existingIds = await prisma.idea.findMany({ select: { id: true } });
    const maxNum = existingIds.reduce((max, row) => {
      const match = row.id.match(/^IDEA-(\d+)$/);
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const id = `IDEA-${String(maxNum + 1).padStart(4, "0")}`;
    const rawIdea = body.title || body.raw_idea || "Untitled Signal";
    const angle = body.angle || body.excerpt || "Operational analysis and technical trade implications";

    const created = await prisma.idea.create({
      data: {
        id,
        rawIdea,
        angle,
        audience: body.audience || "ICP",
        targetTrade: body.trade || body.target_trade || "HVAC",
        pillar: body.pillar || "Contractor Realities",
        source: body.source || "MANUAL",
        status: "HARVESTED",
        priority: body.priority || "HIGH",
        tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : [],
        icpRelevance: 90
      }
    });

    const newIdea: IdeaItem = {
      id: created.id,
      ideaId: created.id,
      title: created.rawIdea,
      raw_idea: created.rawIdea,
      excerpt: created.angle || "Strategic angle",
      angle: created.angle || "",
      audience: (created.audience || "ICP") as "ICP" | "PEER" | "BRIDGE",
      target_trade: created.targetTrade,
      pillar: created.pillar,
      source: (created.source || "MANUAL") as any,
      tags: created.tags,
      status: "HARVESTED",
      estimated_cost: 0.038,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    };

    return NextResponse.json(newIdea, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
