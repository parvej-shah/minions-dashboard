import type { ChatPayload } from "./types";

/** The slice of GET /api/brand/context the harvest prompt reads. */
export interface HarvestBrand {
  company_name?: string;
  positioning?: string;
  voice_guidelines?: { cadence?: string; forbidden_lexicon?: string[]; allowed_proof?: string[] };
  directives?: { category?: string; key?: string; instruction?: string; content?: string }[];
  writer_expertise_guidance?: string;
  pillar_rotation?: { pillar: string; brief: string }[];
  recent_theses?: string[];
}

export interface MarketSignal {
  title: string;
  url: string;
  source_name: string;
  snippet: string;
  published_at?: string;
}

/** 01_idea_harvester › Build Harvest Payload */
export interface HarvestInput {
  brand: HarvestBrand;
  /** Already selected and rotated by the n8n node (max 18). */
  market_signals: MarketSignal[];
}

export function renderHarvest(input: HarvestInput): ChatPayload {
  const brandContext = input.brand || {};
  const marketSignals = input.market_signals || [];

  const companyName = brandContext.company_name || "this business";
  const positioning = brandContext.positioning || "Enterprise clients and operations leaders.";
  const cadence = brandContext.voice_guidelines?.cadence || "Direct, concise, and citable.";
  const forbiddenList = (brandContext.voice_guidelines?.forbidden_lexicon || []).join(", ");
  const allowedProof = (brandContext.voice_guidelines?.allowed_proof || []).join("\n- ");
  const directives = brandContext.directives || [];
  // The AUTHOR's standing, not the reader's. Governs what an idea may claim as
  // evidence (cited work vs. lived experience); reading level comes from the
  // positioning/ICP directives instead, so the two never fight.
  const expertiseGuidance = brandContext.writer_expertise_guidance || "";

  // Per-run angle set, chosen by the dashboard and rotated across runs.
  const rotation =
    Array.isArray(brandContext.pillar_rotation) && brandContext.pillar_rotation.length
      ? brandContext.pillar_rotation
      : [
          { pillar: "The Stakes", brief: "Make the cost of inaction concrete." },
          { pillar: "The Myth", brief: "Challenge a widespread belief in this field." },
          { pillar: "How It Works", brief: "Explain a real mechanism in useful detail." },
        ];

  // The do-not-repeat list: fingerprints of the most recent theses.
  const recentTheses = Array.isArray(brandContext.recent_theses) ? brandContext.recent_theses : [];

  type Directive = (typeof directives)[number];
  function directiveBlock(filterFn: (d: Directive) => boolean) {
    return directives
      .filter(filterFn)
      .map((d) => `- ${d.key}: ${d.instruction || d.content}`)
      .join("\n");
  }

  const corePhilosophy = directiveBlock((d) => d.category === "EDITORIAL_PHILOSOPHY" || d.category === "VOICE" || d.key === "core_philosophy");
  const coreThemes = directiveBlock((d) => d.category === "CONTENT_THEMES" || d.category === "TOPICS" || d.key === "core_themes");
  const audienceLanes = directiveBlock((d) => d.category === "AUDIENCE_LANES" || d.category === "AUDIENCE" || (d.key || "").startsWith("lane_"));
  const voiceRules = directives
    .filter((d) => ["VOICE_DO", "VOICE_DOS", "VOICE", "WRITING_STYLE"].includes(d.category || ""))
    .map((d) => `- ${d.instruction || d.content}`)
    .join("\n");

  const angleSpec = rotation.map((a, i) => `ANGLE ${i + 1} — ${a.pillar}\n${a.brief}`).join("\n\n");

  const jsonSkeleton = rotation
    .map(
      (a) =>
        `    { "raw_idea": "1-2 sentences", "angle": "One sharp, concrete claim", "pillar": "${a.pillar}", "priority": "HIGH | MEDIUM | LOW", "target_trade": "", "geo_metro": "National", "why": "Why this lands with this audience", "icp_relevance": "0-100 integer", "evidence_required": "Y", "signal_index": null }`
    )
    .join(",\n");

  const harvestSystemPrompt = `You are the Lead Content Strategist for ${companyName}.
Generate sharp, authoritative, citable B2B content ideas aligned with this company's positioning and editorial philosophy.

COMPANY POSITIONING & TARGET AUDIENCE:
${positioning}

${expertiseGuidance ? `AUTHOR STANDING (governs what each idea may claim as evidence, NOT how technical it is -- depth comes from the audience above):\n${expertiseGuidance}\n` : ''}
${corePhilosophy ? `CORE EDITORIAL PHILOSOPHY:\n${corePhilosophy}\n` : ''}
${coreThemes ? `CORE CONTENT THEMES:\n${coreThemes}\n` : ''}
${audienceLanes ? `TARGET AUDIENCE LANES:\n${audienceLanes}\n` : ''}
${voiceRules ? `VOICE & STYLE DIRECTIVES:\n${voiceRules}\nCadence: ${cadence}\n` : ''}
${allowedProof ? `VERIFIED PROOF WE CAN POINT TO:\n- ${allowedProof}\n` : ''}
${forbiddenList ? `FORBIDDEN BUZZWORDS:\nNever use: ${forbiddenList}\n` : ''}

Generate EXACTLY ${rotation.length} distinct ideas, one for each angle below, in order.

${angleSpec}

STRICT CONSTRAINTS:
1. Ideas MUST be grounded in ${companyName}'s domain.
2. Every idea must be a NEW argument. The RECENTLY COVERED list below is what this brand has already published or queued — do not restate any of it, even in different words. If your idea's core claim matches one of those fingerprints, discard it and find another.
3. State a clear, specific thesis for each idea. Usefulness and credibility are mandatory.
4. Use a market signal only when its title and excerpt are directly relevant. Otherwise set signal_index to null and derive the idea from positioning.
5. Never invent a metric, result, customer anecdote, product capability, or quotation. A signal's excerpt supports only what it literally says.
6. Each idea must take its assigned angle. Do not collapse all three into the same shape.
7. Set signal_index to the 1-based number of the signal that inspired it, or null.
8. Set priority per idea, not the same value every time: HIGH only for an idea tied to a time-sensitive or high-stakes signal the audience must act on now; MEDIUM for a solid, evergreen argument; LOW for a minor or speculative angle.
9. Set icp_relevance to your own 0-100 estimate of how directly this idea matches ${companyName}'s positioning and audience above: 90+ only for a bullseye match, 40-60 for a plausible but generic fit, under 30 if the signal barely relates. Vary it per idea -- do not default to a fixed number.

Return ONLY this JSON:
{
  "ideas": [
${jsonSkeleton}
  ]
}
Return ONLY valid JSON. No markdown code fences.`;

  const userMessage = `MARKET SIGNALS:
${marketSignals.map((s, i) => `[${i + 1}] [${s.source_name}] ${s.title}\nURL: ${s.url}\nExcerpt: ${s.snippet}`).join('\n\n')}

RECENTLY COVERED (do not repeat these arguments — each line is a keyword fingerprint of an idea already in the pipeline):
${recentTheses.slice(0, 60).join('\n')}

Generate exactly ${rotation.length} ideas for ${companyName}, one per assigned angle.`;

  return {
    model: "qwen3.7-max",
    enable_thinking: false,
    // High on purpose: the angle set varies per run, so sampling diversity
    // helps rather than drifting off-brief.
    temperature: 0.9,
    max_tokens: 2500,
    messages: [
      { role: "system", content: harvestSystemPrompt },
      { role: "user", content: userMessage },
    ],
  };
}
