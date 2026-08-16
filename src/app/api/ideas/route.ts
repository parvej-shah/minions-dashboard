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
    const newIdea: IdeaItem = {
      id: `IDEA-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      raw_idea: body.raw_idea || "Untitled Signal",
      angle: body.angle || "Operational analysis and technical trade implications",
      audience: body.audience || "ICP",
      target_trade: body.target_trade || "HVAC",
      pillar: body.pillar || "Operations",
      source: body.source || "MANUAL_INJECTION",
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
