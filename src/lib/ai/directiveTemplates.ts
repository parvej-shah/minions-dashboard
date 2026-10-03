import { BRAND_PRESETS, type BrandPreset } from "@/constants/brandPresets";
import type { GeneratedDirective } from "@/lib/ai/brandCopilot";

const MAX_DIRECTIVES = 6;
const MAX_VOICE_SAMPLE = 240;
const MAX_FORBIDDEN_WORDS = 8;

const directive = (
  category: GeneratedDirective["category"],
  rule_key: string,
  instruction: string,
  priority: number
): GeneratedDirective => ({ category, rule_key, instruction, priority });

export interface TemplateInput {
  businessName: string;
  industry: string;
  contentFocus: string;
  differentiator: string;
  myth: string;
  avoid: string;
  voiceSample: string;
  selectedPresetId?: string;
}

function pickPreset(industry: string, selectedPresetId?: string): BrandPreset {
  return (
    BRAND_PRESETS.find((preset) => preset.id === selectedPresetId) ||
    BRAND_PRESETS.find((preset) => preset.industry.toLowerCase().includes(industry.toLowerCase())) ||
    BRAND_PRESETS[0]
  );
}

function cadenceInstruction(voiceSample: string, preset: BrandPreset): string {
  if (!voiceSample) {
    return `Write in concise 1-3 sentence paragraphs. Keep the tone ${preset.toneFormality.replace("_", " ")}. Use punchy hooks and clear actionable takeaways.`;
  }
  const clipped = `${voiceSample.slice(0, MAX_VOICE_SAMPLE)}${voiceSample.length > MAX_VOICE_SAMPLE ? "..." : ""}`;
  return `Match the user's sampled voice: ${clipped} Keep the same sentence rhythm and level of directness without copying lines verbatim.`;
}

// Fallback when the model is unavailable, so onboarding never blocks on it.
export function templateDirectives(input: TemplateInput) {
  const { businessName, industry, contentFocus, differentiator, myth, avoid, voiceSample } = input;
  const preset = pickPreset(industry, input.selectedPresetId);

  const directives = [
    directive(
      "POSITIONING",
      "CORE_POSITIONING_PERSPECTIVE",
      `Position ${businessName} as an authoritative, grounded voice in ${industry}. Focus on practical realities and tangible outcomes over generic theory.`,
      1
    ),
    ...(contentFocus
      ? [
          directive(
            "TOPICS",
            "CORE_CONTENT_FOCUS",
            `Generate ideas within this territory: ${contentFocus}. Prioritize specific, practical angles over broad industry commentary.`,
            1
          ),
        ]
      : []),
    directive(
      "POSITIONING",
      "UNIQUE_VALUE_PROPOSITION",
      differentiator
        ? `Highlight ${businessName}'s key differentiator: "${differentiator}". Anchor proof points and arguments around this operational strength.`
        : "Emphasize verifiable execution, fast turnaround times, and transparent communication in all case studies.",
      1
    ),
    directive(
      "VOICE",
      "DEBUNK_INDUSTRY_MYTHS",
      myth
        ? `Actively challenge the common industry misconception: "${myth}". Contrast flawed traditional approaches with our proven modern methodology.`
        : "Call out low-quality industry shortcuts, hidden costs, and common pitfalls that clients frequently encounter.",
      2
    ),
    directive("VOICE", "PROSE_CADENCE_AND_RHYTHM", cadenceInstruction(voiceSample, preset), 2),
    ...(avoid
      ? [
          directive(
            "FORBIDDEN",
            "STRICT_CONTENT_BOUNDARIES",
            `FORBIDDEN: Never mention, promise, or discuss: "${avoid}". Keep all statements strictly within verified capabilities.`,
            1
          ),
        ]
      : []),
    directive(
      "FORBIDDEN",
      "ANTI_FLUFF_VOCABULARY_FILTER",
      `FORBIDDEN BUZZWORDS: Never use empty marketing buzzwords such as: ${preset.forbiddenWords.slice(0, MAX_FORBIDDEN_WORDS).join(", ")}. State facts directly with zero corporate filler.`,
      1
    ),
  ];

  const positioningSummary = `${businessName} provides high-reliability ${industry} solutions. Editorial focus centers on ${contentFocus || differentiator || "operational excellence"}, with clear, fluff-free insights.`;
  return { positioningSummary, directives: directives.slice(0, MAX_DIRECTIVES) };
}
