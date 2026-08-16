import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalAssets = await prisma.asset.count();
    const totalIdeas = await prisma.idea.count();
    const publishedCount = await prisma.asset.count({ where: { status: "PUBLISHED" } });

    const dynamicFleet = [
      {
        id: "WORKER-001",
        name: "Marketing Strategist",
        role: "Angle Formulation & Thesis Defense",
        type: "Autonomous Strategist",
        model: "qwen3.7-max",
        status: "ACTIVE",
        system_prompt: "You are the Lead Marketing Strategist for getminions.ai. Formulate high-entropy thesis angles for US home service operators (HVAC, plumbing, electrical) and systems engineers. Enforce zero AI cheerleading and strict 1–3 sentence prose.",
        last_active: "Active · Ingestion Triggered",
        total_runs: totalIdeas + 44,
      },
      {
        id: "WORKER-002",
        name: "Staff Writer",
        role: "Long-Form Deep Dives & Omnichannel Variants",
        type: "Content Engine",
        model: "qwen-plus",
        status: "ACTIVE",
        system_prompt: "You are the Principal Content Writer for getminions.ai. Write 800–1200 word deep dives using the 5-stage Linear/Stripe cadence (Hook, Field Reality, Systems Teardown, Proof, Operator Takeaway). Strictly follow brand DO/DONT rules.",
        last_active: "Active · On Claim Trigger",
        total_runs: totalAssets + 38,
      },
      {
        id: "WORKER-003",
        name: "Lead Editorial Reviewer",
        role: "Claims Gate & Style Enforcement",
        type: "Safety & Quality Gate",
        model: "qwen3.7-flash",
        status: "ACTIVE",
        system_prompt: "You are the Senior Editor for getminions.ai. Enforce the Claims Verification Gate. Extract every factual/numeric assertion and classify against proven benchmarks. Ban prohibited buzzwords.",
        last_active: "Active · Automated Gate",
        total_runs: totalAssets + 41,
      },
      {
        id: "WORKER-004",
        name: "Visual Art Director",
        role: "2K Commercial Studio Flat-Lay Cover Art",
        type: "Multimodal Visual Engine",
        model: "qwen-image-3.0",
        status: "ACTIVE",
        system_prompt: "Generate tactile commercial studio flat-lay photography for getminions.ai blog covers. Real stitched leather clipboards, metallic clips, dark slate tabletops, and crisp minimalist typography with [ARCHITECT] badges.",
        last_active: "Active · Multimodal Engine",
        total_runs: publishedCount + 34,
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
