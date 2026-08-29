import { NextResponse } from "next/server";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";
import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";

interface CopilotInput {
  industry?: string;
  businessName?: string;
  websiteUrl?: string;
  mythAnswer?: string;
  differentiatorAnswer?: string;
  avoidAnswer?: string;
  selectedPresetId?: string;
}

export interface GeneratedDirective {
  category: "EDITORIAL_PILLARS" | "VOICE_AND_STYLE" | "SAFETY_GUARDRAILS";
  rule_key: string;
  instruction: string;
  priority: number;
}

/**
 * Intelligent Brand Copilot:
 * Synthesizes 5-7 sharp, customized Brand Directives from 3 simple conversational answers
 * combined with industry archetypes.
 */
export async function POST(request: Request) {
  const ctx = await requireRealTenantUser(true);
  if ("error" in ctx) return ctx.error;

  try {
    const body: CopilotInput = await request.json();
    const industry = (body.industry || "General Business").trim();
    const businessName = (body.businessName || "Our Brand").trim();
    const myth = (body.mythAnswer || "").trim();
    const differentiator = (body.differentiatorAnswer || "").trim();
    const avoid = (body.avoidAnswer || "").trim();

    // Find best matching preset
    const preset: BrandPreset =
      BRAND_PRESETS.find((p) => p.id === body.selectedPresetId) ||
      BRAND_PRESETS.find((p) => p.industry.toLowerCase().includes(industry.toLowerCase())) ||
      BRAND_PRESETS[0];

    const directives: GeneratedDirective[] = [];

    // 1. Core Editorial Positioning Directive
    directives.push({
      category: "EDITORIAL_PILLARS",
      rule_key: "CORE_POSITIONING_PERSPECTIVE",
      instruction: `Position ${businessName} as an authoritative, grounded voice in ${industry}. Focus on practical realities and tangible outcomes over generic theory.`,
      priority: 1,
    });

    // 2. The Differentiator Directive (from user's real answer)
    if (differentiator) {
      directives.push({
        category: "EDITORIAL_PILLARS",
        rule_key: "UNIQUE_VALUE_PROPOSITION",
        instruction: `Highlight ${businessName}'s key differentiator: "${differentiator}". Anchor proof points and arguments around this operational strength.`,
        priority: 1,
      });
    } else {
      directives.push({
        category: "EDITORIAL_PILLARS",
        rule_key: "UNIQUE_VALUE_PROPOSITION",
        instruction: `Emphasize verifiable execution, fast turnaround times, and transparent communication in all case studies.`,
        priority: 1,
      });
    }

    // 3. The Contrarian / Myth Directive (from user's real answer)
    if (myth) {
      directives.push({
        category: "VOICE_AND_STYLE",
        rule_key: "DEBUNK_INDUSTRY_MYTHS",
        instruction: `Actively challenge the common industry misconception: "${myth}". Contrast flawed traditional approaches with our proven modern methodology.`,
        priority: 2,
      });
    } else {
      directives.push({
        category: "VOICE_AND_STYLE",
        rule_key: "DEBUNK_INDUSTRY_MYTHS",
        instruction: `Call out low-quality industry shortcuts, hidden costs, and common pitfalls that clients frequently encounter.`,
        priority: 2,
      });
    }

    // 4. Voice & Tone Cadence Directive
    directives.push({
      category: "VOICE_AND_STYLE",
      rule_key: "PROSE_CADENCE_AND_RHYTHM",
      instruction: `Write in concise 1–3 sentence paragraphs. Keep the tone ${preset.toneFormality.replace("_", " ")}. Use punchy hooks and clear actionable takeaways.`,
      priority: 2,
    });

    // 5. Safety & Forbidden Topics Directive (from user's red lines)
    if (avoid) {
      directives.push({
        category: "SAFETY_GUARDRAILS",
        rule_key: "STRICT_CONTENT_BOUNDARIES",
        instruction: `FORBIDDEN: Never mention, promise, or discuss: "${avoid}". Keep all statements strictly within verified capabilities.`,
        priority: 1,
      });
    }

    // 6. Universal Anti-Fluff & Buzzword Safety Directive
    const forbiddenList = preset.forbiddenWords.slice(0, 8).join(", ");
    directives.push({
      category: "SAFETY_GUARDRAILS",
      rule_key: "ANTI_FLUFF_VOCABULARY_FILTER",
      instruction: `FORBIDDEN BUZZWORDS: Never use empty marketing buzzwords such as: ${forbiddenList}. State facts directly with zero corporate filler.`,
      priority: 1,
    });

    const positioningSummary = `${businessName} provides high-reliability ${industry} solutions. Editorial focus centers on ${differentiator || "operational excellence"}, challenging common industry misconceptions (${myth || "inefficient legacy practices"}), and delivering clear, fluff-free insights.`;

    return NextResponse.json({
      success: true,
      businessName,
      industry,
      positioningSummary,
      directives: directives.slice(0, 6),
    });
  } catch (error) {
    return apiError(error, "Failed to generate brand directives with Copilot");
  }
}
