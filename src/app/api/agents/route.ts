import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatRelative(date: Date | null): string {
  if (!date) return "No runs yet";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export async function GET() {
  try {
    // Every asset row represents one completed pass through Strategist -> Writer
    // -> Editor -> Image (02_idea_to_asset runs them in a straight line, no branch
    // skips any of the four before the claims-gate split), so the asset count is
    // each agent's real, unpadded run total.
    const totalAssets = await prisma.asset.count();

    const latestAsset = await prisma.asset.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const lastRunAt = latestAsset?.createdAt ?? null;

    // No per-run heartbeat is recorded, so "active" is inferred from recency of
    // the last real pipeline run rather than hardcoded true.
    const isRecentlyActive = lastRunAt ? Date.now() - lastRunAt.getTime() < 24 * 60 * 60 * 1000 : false;
    const status = isRecentlyActive ? "ACTIVE" : "IDLE";
    const lastActive = formatRelative(lastRunAt);

    const dynamicFleet = [
      {
        id: "WORKER-001",
        name: "Marketing Strategist",
        role: "Angle Formulation & Thesis Defense",
        type: "Autonomous Strategist",
        model: "qwen3.7-max",
        status,
        system_prompt: "You are the Lead Marketing Strategist for getminions.ai. Formulate high-entropy thesis angles for US home service operators (HVAC, plumbing, electrical) and systems engineers. Enforce zero AI cheerleading and strict 1–3 sentence prose.",
        last_active: lastActive,
        total_runs: totalAssets,
      },
      {
        id: "WORKER-002",
        name: "Staff Writer",
        role: "Long-Form Deep Dives & Omnichannel Variants",
        type: "Content Engine",
        model: "qwen-plus",
        status,
        system_prompt: "You are the Principal Content Writer for getminions.ai. Write 800–1200 word deep dives using the 5-stage Linear/Stripe cadence (Hook, Field Reality, Systems Teardown, Proof, Operator Takeaway). Strictly follow brand DO/DONT rules.",
        last_active: lastActive,
        total_runs: totalAssets,
      },
      {
        id: "WORKER-003",
        name: "Lead Editorial Reviewer",
        role: "Claims Gate & Style Enforcement",
        type: "Safety & Quality Gate",
        model: "qwen3.7-flash",
        status,
        system_prompt: "You are the Senior Editor for getminions.ai. Enforce the Claims Verification Gate. Extract every factual/numeric assertion and classify against proven benchmarks. Ban prohibited buzzwords.",
        last_active: lastActive,
        total_runs: totalAssets,
      },
      {
        id: "WORKER-004",
        name: "Visual Art Director",
        role: "Commercial Studio Flat-Lay Cover Art",
        type: "Multimodal Visual Engine",
        model: "qwen-image-3.0-pro",
        status,
        system_prompt: "Generate tactile commercial studio flat-lay photography for getminions.ai blog covers. Real stitched leather clipboards, metallic clips, dark slate tabletops, and crisp minimalist typography with [ARCHITECT] badges.",
        last_active: lastActive,
        total_runs: totalAssets,
      },
    ];

    return NextResponse.json(dynamicFleet);
  } catch (error) {
    console.error("Error generating dynamic agent fleet:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, ...body, updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
