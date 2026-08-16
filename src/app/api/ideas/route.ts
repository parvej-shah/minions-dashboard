import { NextResponse } from "next/server";
import { fetchIdeas, INITIAL_IDEAS } from "@/lib/api";
import { IdeaItem } from "@/lib/types";

export async function GET() {
  const ideas = await fetchIdeas();
  return NextResponse.json(ideas);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = `IDEA-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const title = body.title || body.raw_idea || "Untitled Signal";
    const newIdea: IdeaItem = {
      id,
      ideaId: id,
      title,
      raw_idea: title,
      excerpt: body.excerpt || body.angle || "Manual topic injected for strategic editorial evaluation and drafting.",
      angle: body.angle || body.excerpt || "Operational analysis and technical trade implications",
      audience: body.audience || "ICP",
      target_trade: body.trade || body.target_trade || "HVAC",
      pillar: body.pillar || "Operations",
      source: body.source || "MANUAL",
      tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : [],
      status: "HARVESTED",
      estimated_cost: 0.038,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
