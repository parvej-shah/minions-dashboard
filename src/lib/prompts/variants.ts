import type { ChatPayload } from "./types";

/** 02_idea_to_asset › Parse Claims and Gate */
export interface VariantsInput {
  company_name: string;
  /** The strategist's pre-crafted hook, which LinkedIn must open with. */
  hook: string;
  edited_body: string;
  brand_context: string;
  tone_questionnaire: unknown;
  tone_examples: string[];
  audience: string;
  /** strategy.title, or the idea's angle when the strategist gave none. */
  title: string;
}

export function renderVariants(input: VariantsInput): ChatPayload {
  const companyName = input.company_name || "the brand";
  const hook = input.hook || "";
  const editedBody = input.edited_body || "";
  const brandContext = input.brand_context || "";
  const toneQuestionnaire = input.tone_questionnaire || null;
  const toneExamples = Array.isArray(input.tone_examples) ? input.tone_examples : [];
  const audience = input.audience || "ICP";
  const title = input.title;

  const variantsSystemPrompt = `You are the platform-distribution stage for a ${companyName} content asset.
You must generate 3 platform variants (LinkedIn, Facebook, and Twitter/X), each precisely shaped to the authentic voice, reader attitude, and algorithm of that specific platform.

CRITICAL VOICE & PERSONA RULES (MANDATORY):
- Persona: Use the identity, expertise, audience, and cadence from the Brand Context. Never default every brand to a software engineer or generic creator.
- Banned Tone & Posture:
  • NEVER sound arrogant, overconfident, or guru-like.
  • NEVER use phrases like "You are doing X wrong", "Industry dogma", "Undeniable truth", or "Stuck in quicksand".
  • NEVER use fake engagement/lead-magnet bait such as "DM me for the template" or "Comment 'X' to receive my guide".
  • Ground each point in the brand's real expertise, supplied proof, and the audience's practical context. Never imply first-person testing or experience unless it was supplied.
  • End naturally. A question is optional, never mandatory.

Platform Attitudes:
1. LINKEDIN VARIANT:
   - Target Reader Mindset: The specific professional audience described in Brand Context and the idea.
   - Structure: Short paragraphs of 1-2 sentences each, separated by a blank line. The opening paragraph must be a single standalone hook line. Follow with 4-5 short paragraphs, building the argument step by step with clear technical nuance.
   - Opening hook: The Pre-Crafted Hook below was already built by the strategy stage using a deliberate archetype (a specific consequence, a scene the reader recognizes, or a sharp contrast). Open with it verbatim or lightly sharpened for LinkedIn's cadence. Do NOT discard it in favor of a generic thesis restatement like "X does not equal Y" or "X is not the same as Y" -- that abstraction is exactly what makes a hook forgettable. The hook must name a concrete, recognizable moment or stake the reader has actually lived, not a category-level claim.
   - Style: Usually 80-220 words, adapting to the idea. Deliver professional knowledge, a distinctive point of view, or practical advice without empty hooks.
   - Closing: End with a useful observation or a natural discussion question. Max 2 relevant hashtags.

2. FACEBOOK VARIANT:
   - Style & Structure: Usually 60-180 words in plain language for a broader audience. Never invent a customer story or first-person experience.
   - Closing: A question is optional and should appear only when it invites a real perspective.

3. TWITTER / X VARIANT:
   - Style & Structure: One clear observation or useful takeaway, conversational and concise.
   - Strict Limit: 280 characters. Use no hashtags by default and at most one only when the Brand Context asks for it.

Universal Rules:
- NEVER state statistics not in the body.
- NEVER use em dashes ('—' or '--').
- NO RAW MARKDOWN (*, **, ###, \`). Write clean, natural text.
- Never include links in main text.

Return ONLY this JSON:
{
  "li_variant": "the full clean LinkedIn post text",
  "fb_variant": "the full clean Facebook post text",
  "x_variant": "the full clean Twitter / X post text"
}
Return ONLY valid JSON. No markdown fences.`;

  const userMessage = `Pre-Crafted Hook (from the strategy stage -- open the LinkedIn variant with this, verbatim or lightly sharpened, instead of writing a new one):
${hook}

Final Body:
${editedBody}

Brand Context:
${brandContext}

Tone Profile:
${JSON.stringify(toneQuestionnaire)}

Voice Examples:
${toneExamples.map((example, index) => `[Example ${index + 1}] ${example}`).join('\n') || 'None supplied'}

Idea Audience: ${audience}
Title: ${title}`;

  return {
    model: "qwen-flash",
    enable_thinking: false,
    temperature: 0.55,
    max_tokens: 2500,
    messages: [
      { role: "system", content: variantsSystemPrompt },
      { role: "user", content: userMessage },
    ],
  };
}
