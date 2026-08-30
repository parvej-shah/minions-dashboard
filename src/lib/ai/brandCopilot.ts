/**
 * Shared LLM plumbing for onboarding's brand-personalization calls (Brand
 * Interview suggestion chips + "Generate My Brand Directives"). Every call
 * site here must degrade to `null` on a missing key, timeout, non-200, or
 * unparseable response -- never throw -- so onboarding's static/template
 * fallbacks always have somewhere safe to land.
 */

const QWEN_ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 12000;

export interface AiSuggestions {
  myths: string[];
  differentiators: string[];
  avoids: string[];
}

export interface GeneratedDirective {
  category: "POSITIONING" | "VOICE" | "FORBIDDEN";
  rule_key: string;
  instruction: string;
  priority: number;
}

async function callQwen(prompt: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(QWEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[AI] Qwen non-200 response:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.warn("[AI] Qwen call failed:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonResponse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.warn("[AI] Failed to parse LLM JSON response:", e);
    return null;
  }
}

export interface BrandSuggestionInput {
  businessName: string;
  industry: string;
  headline?: string;
  postSamples?: string[];
}

/**
 * Generates the 3-question Brand Interview suggestion chips from whatever
 * the caller actually knows -- a full LinkedIn profile + post samples, or
 * just the business name and industry typed in Step 1. Falls back to `null`
 * so callers can drop back to the static INDUSTRY_SUGGESTIONS map.
 */
export async function generateBrandSuggestionsWithLLM(input: BrandSuggestionInput): Promise<AiSuggestions | null> {
  const postsContext =
    input.postSamples && input.postSamples.length > 0
      ? input.postSamples.slice(0, 3).map((p, i) => `Sample ${i + 1}: "${p.slice(0, 400)}"`).join("\n")
      : "No sample post provided.";

  const prompt = `You are a world-class brand strategist calibrating a personalized content engine during onboarding.

Business: ${input.businessName}
Industry: ${input.industry}
${input.headline ? `Role / Headline: ${input.headline}` : ""}

User's Pasted Post / Writing Sample:
${postsContext}

Task:
Generate 3 highly relevant, non-generic suggestions for each of the 3 brand interview questions below, grounded specifically in this business and industry -- not generic marketing boilerplate.
1. A common myth or bad advice in their industry they might disagree with.
2. Their likely #1 differentiator (why clients would hire them).
3. Topics or claims they should strictly avoid.

Return ONLY a single valid JSON object (no markdown, no explanation, no fake company names):
{
  "myths": ["myth 1", "myth 2", "myth 3"],
  "differentiators": ["diff 1", "diff 2", "diff 3"],
  "avoids": ["avoid 1", "avoid 2", "avoid 3"]
}`;

  const raw = await callQwen(prompt);
  const parsed = parseJsonResponse<Partial<AiSuggestions>>(raw);
  if (
    !parsed ||
    !Array.isArray(parsed.myths) ||
    !Array.isArray(parsed.differentiators) ||
    !Array.isArray(parsed.avoids)
  ) {
    return null;
  }

  return { myths: parsed.myths, differentiators: parsed.differentiators, avoids: parsed.avoids };
}

export interface BrandDirectiveInput {
  businessName: string;
  industry: string;
  mythAnswer: string;
  differentiatorAnswer: string;
  avoidAnswer: string;
  /** LinkedIn headline, when the user connected LinkedIn -- extra grounding signal. */
  headline?: string;
}

const VALID_CATEGORIES = new Set(["POSITIONING", "VOICE", "FORBIDDEN"]);

/**
 * Synthesizes the onboarding "Brand Copilot" directives + positioning
 * summary from the user's own 3 typed answers via an actual LLM call, rather
 * than the fixed sentence templates in `api/onboarding/brand-copilot/route.ts`.
 * Falls back to `null` so the caller can use those templates instead.
 */
export async function generateBrandDirectivesWithLLM(
  input: BrandDirectiveInput
): Promise<{ directives: GeneratedDirective[]; positioningSummary: string } | null> {
  const prompt = `You are a world-class editorial strategist setting up a brand's content guardrails during onboarding.

Business: ${input.businessName}
Industry: ${input.industry}
${input.headline ? `Founder/operator's professional headline: ${input.headline}\n` : ""}Myth they disagree with: ${input.mythAnswer || "(not specified)"}
Their #1 differentiator: ${input.differentiatorAnswer || "(not specified)"}
Topics/claims to strictly avoid: ${input.avoidAnswer || "(not specified)"}

Task:
Write 5-6 sharp, specific brand directives grounded in the answers above (do not invent facts not implied by them), plus a 1-2 sentence positioning summary. Each directive's "instruction" must be a concrete, actionable rule for an AI writer -- not vague marketing language.

Categories to use (exactly these strings): "POSITIONING" (who they are / their differentiator), "VOICE" (tone, myths to challenge, cadence), "FORBIDDEN" (topics/claims/buzzwords to never use).

Return ONLY a single valid JSON object (no markdown, no explanation):
{
  "positioningSummary": "1-2 sentence summary",
  "directives": [
    { "category": "POSITIONING", "rule_key": "short_snake_case_key", "instruction": "...", "priority": 1 }
  ]
}`;

  // Heavier structured-output prompt than the suggestion-chip call; give it
  // more headroom before falling back to the template -- onboarding's
  // ≤2-minute budget can absorb a few extra seconds here.
  const raw = await callQwen(prompt, 15000);
  const parsed = parseJsonResponse<{ positioningSummary?: string; directives?: GeneratedDirective[] }>(raw);
  if (!parsed?.positioningSummary || !Array.isArray(parsed.directives)) return null;

  const validDirectives = parsed.directives.filter(
    (d): d is GeneratedDirective =>
      !!d && VALID_CATEGORIES.has(d.category) && typeof d.rule_key === "string" && typeof d.instruction === "string"
  );
  if (!validDirectives.length) return null;

  return { positioningSummary: parsed.positioningSummary, directives: validDirectives.slice(0, 6) };
}
