import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBrandSettings } from "@/lib/api";

export async function GET() {
  const brand = await fetchBrandSettings();
  
  // Format structured brand context payload for n8n LLM ingestion directly from Supabase via Prisma
  let activeDirectives: any[] = [];
  try {
    const dbDirectives = await prisma.brandDirective.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" }
    });
    activeDirectives = dbDirectives.map(d => ({
      id: d.id,
      category: d.category,
      key: d.ruleKey,
      content: d.instruction,
      priority: d.priority,
      audience_scope: d.audienceScope,
      is_active: d.isActive
    }));
  } catch (e) {
    activeDirectives = [];
  }
  
  const contextPayload = {
    company_name: "getminions.ai",
    brand_domain: "https://getminions.ai",
    positioning: "AI operations partner for US home-services businesses (1-10 techs)",
    primary_logo_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions_logo_primary.svg",
    colors: {
      primary_ink: "#12242a",
      brand_teal: "#0e5c63",
      brand_coral: "#ff6b4a",
      brand_cream: "#fff8f0"
    },
    voice_guidelines: {
      cadence: "1-3 sentence paragraphs, zero marketing fluff, Stripe/Linear engineering rigor",
      forbidden_lexicon: [
        "delve", "testament", "tapestry", "seamless", "game-changing", 
        "revolutionize", "unlock", "synergy", "in today's fast-paced world", "the future of", "🚀"
      ],
      allowed_proof: [
        "Live callable AI voice demo number",
        "Deterministic JSON schema validation pipeline",
        "Sub-1.8s WebSocket voice turnaround latency"
      ]
    },
    directives: activeDirectives
  };

  return NextResponse.json(contextPayload);
}
