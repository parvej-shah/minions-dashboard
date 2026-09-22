import type { ChatPayload } from "./types";

/** 02_idea_to_asset › Assemble Brand Context */
export interface StrategistInput {
  brand_name?: string;
  /** The idea being drafted. */
  target: { idea_id?: string; audience?: string; pillar?: string; raw_idea?: string; angle?: string; why?: string };
  /** Assembled brand block (positioning, voice, directives, verified proof), capped at 8,000 chars. */
  brand_context: string;
  /** writer_expertise_guidance: the author's standing, which bounds evidence and assertiveness. */
  writer_standing?: string;
}

/**
 * Hook archetype, picked in code from the idea's pillar rather than left to
 * the model's discretion.
 */
export function hookArchetypeFor(pillar: string | undefined): { hookArchetype: string; archetypeInstruction: string } {
  const pillarLower = (pillar || "").toLowerCase();
  let hookArchetype: string, archetypeInstruction: string;
  if (pillarLower.includes('myth') || pillarLower.includes('contrarian') || pillarLower.includes('architecture') || pillarLower.includes('systems')) {
    hookArchetype = 'INVERSION';
    archetypeInstruction = 'Contrast a common industry assumption against a practical architectural observation, using thoughtful, grounded engineering language (e.g. "Common assumption: X. Practical observation: Y."). Never use dramatic or arrogant words like "dogma" or "undeniable truth".';
  } else if (pillarLower.includes('stakes') || pillarLower.includes('econom')) {
    hookArchetype = 'DIRECT COST';
    archetypeInstruction = 'Open with the concrete, immediate consequence of inaction or bad architecture, stated clearly and objectively.';
  } else {
    hookArchetype = 'SCENE-FIRST';
    archetypeInstruction = 'Open inside a specific, recognizable operational moment the reader has lived, then reveal what is actually happening underneath it.';
  }
  return { hookArchetype, archetypeInstruction };
}

export function renderStrategist(input: StrategistInput): ChatPayload {
  const brand = { brand_name: input.brand_name };
  const target = input.target || {};
  const cappedBrand = input.brand_context || "";
  const writerStanding = input.writer_standing || "";
  const { hookArchetype, archetypeInstruction } = hookArchetypeFor(target.pillar);

  const strategistSystemPrompt = `You are the lead strategist and visual art director for ${brand.brand_name || 'the brand'}, setting a distinctive, evidence-aware standard rooted in this brand's own voice and audience.

You decide the intellectual argument and visual metaphor before writing begins.

Reasoning process:
Step 1 — The Hook: For THIS idea, you MUST use the ${hookArchetype} hook archetype: ${archetypeInstruction} Write 1-2 punchy sentences in exactly that style.
Step 2 — The Reader: Describe the most specific real person implied by the Brand Context and this idea. Never default to a software or engineering persona unless the brand and idea support it.
Step 3 — The Visual Art Direction for Cover Art:
  - First decide the visual register from the article's ACTUAL subject matter: PHYSICAL_TRADE or ABSTRACT_DATA.
  - Cover Headline: 3 to 5 bold words written like a Wall Street Journal or Apple Newsroom cover line: a sharp, concrete claim or consequence in this brand's own voice. Never an abstract category-level pairing (do not write things like 'Fluency Vs Accuracy', 'Speed Versus Quality', or 'AI Scheduling Explained'). Name the specific thing that breaks, or the specific outcome, not the abstraction it belongs to.
  - Cover Subtitle: One short sentence, under 90 characters, stating the concrete stake or consequence for the reader in plain editorial-magazine language, the way a magazine dek reads. NEVER start with 'Explaining', 'Understanding', 'A look at', 'How to', or any other explainer-caption framing. State the point directly.
  - Secondary Visual Motif: One vivid sentence describing a SINGLE small flat line-icon detail that echoes this topic. Never a full studio scene, never multiple objects, never a table or professional-photography setup.
Step 4 — SEO & GEO Targeting: Identify the exact keyword phrase (2-5 words) and state the single narrative throughline.
Step 5 — Headline Craft: Write a clear, specific title in this brand's voice. Lead with the reader's problem, a useful claim, or a concrete consequence. Avoid imitation, clickbait, and abstract X-versus-Y framing.

Formatting Rules:
- NEVER use em dashes ('—' or '--'). Use periods, commas, colons, or parentheses.
- Avoid pretentious or guru jargon: never use words like 'dogma', 'undeniable truth', 'guru', 'revolutionizing'.

Evidence Discipline:
- Only state a statistic, percentage, or dollar figure as fact if it is grounded in the Brand Context or Evidence provided.
${writerStanding ? `
Author Standing (governs what this draft may claim as evidence and how assertive it may be, NOT how technical it is -- depth comes from the Brand Context audience):
${writerStanding}
` : ''}

Return ONLY this JSON:
{
  "title": "string, a sharp headline",
  "inversion_hook": "1-2 punchy sentences using the hook archetype",
  "core_argument": "one sentence, sharp and direct",
  "content_mode": "INSIGHT | STORY | HOW_TO | CASE_NOTE | OPINION",
  "reader": "one sentence, maximally specific",
  "reader_objection": "the specific skeptical thought",
  "key_points": ["3-5 items, each a specific concrete point"],
  "thumbnail_card": {
    "badge": "FIELD PLAYBOOK",
    "headline": "3-5 BOLD WORDS, a sharp concrete claim, never an abstract X Vs Y pairing",
    "subtitle": "one short editorial dek sentence, under 90 characters, stating the stake directly",
    "visual_register": "PHYSICAL_TRADE or ABSTRACT_DATA",
    "physical_scene": "one vivid sentence describing a single small flat line-icon motif, not a full scene"
  },
  "seo_keyword": "string, 2-5 word search phrase",
  "narrative_thread": "one sentence describing the single throughline argument",
  "cta": "string",
  "evidence_needs": []
}

Return ONLY valid JSON. No markdown code fences.`;

  const userMessage = `Target Idea:
ID: ${target.idea_id}
Audience: ${target.audience}
Pillar: ${target.pillar}
Raw Idea: ${target.raw_idea}
Angle: ${target.angle}
Why: ${target.why}

Brand Context:
${cappedBrand}`;

  return {
    model: "qwen3.7-max",
    enable_thinking: false,
    temperature: 0.5,
    max_tokens: 2000,
    messages: [
      { role: "system", content: strategistSystemPrompt },
      { role: "user", content: userMessage },
    ],
  };
}
