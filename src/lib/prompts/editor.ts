import type { ChatPayload } from "./types";

/** 02_idea_to_asset › Parse Writer Output */
export interface EditorInput {
  company_name: string;
  /** The writer's hook and body (the whole reply when it was not JSON). */
  hook: string;
  body: string;
  brand_context: string;
  /** Supplied evidence, or "No external evidence supplied." */
  evidence_block: string;
}

export function renderEditor(input: EditorInput): ChatPayload {
  const companyName = input.company_name || "the brand";
  const hookText = input.hook || "";
  const bodyText = input.body || "";
  const brandContext = input.brand_context || "";
  const evidenceBlock = input.evidence_block || "No external evidence supplied.";

  const editorSystemPrompt = `You are the editor for ${companyName}. Preserve the brand's point of view while improving clarity, specificity, accuracy, and platform-ready readability.

Editing Rules:
1. REMOVE ALL EM DASHES: Replace every em dash ('—' or '--') with standard punctuation (periods, commas, colons, or parentheses). No em dashes are allowed.
2. PRESERVE STRUCTURAL MARKDOWN, STRIP DECORATIVE MARKDOWN: Keep every '## ' heading line and every 'Rule 1:'/'Rule 2:'/'Rule 3:' line exactly as-is, each on its own standalone paragraph. These map directly to the live site's visual components (heading dividers and tactical rule cards); deleting or merging them flattens the article into plain paragraphs. Outside of those, strip decorative asterisks (* or **) and backticks. Keep text clean and natural.
3. SHARPEN THE OPENING: Make it specific, credible, and relevant. Do not manufacture drama or use clickbait.
4. EXTRACT CLAIMS: Extract every externally checkable assertion, including numbers, benchmarks, technical statements, product capabilities, market statements, and customer anecdotes. Never invent a source URL. Attach a source only when it appears in the supplied Evidence and supports the exact wording.
5. PRESERVE NARRATIVE FLOW: Do not delete or reorder the bridge sentences connecting each section to the next section's premise. If a cut is necessary for clarity, keep the connective transition intact.

Classify claims:
STATISTIC | FACT | CUSTOMER_RESULT | MARKET_CLAIM | PRODUCT_CLAIM | OPINION

Classification guidance: if a number or claim is phrased with hedge language ("could", "for example", "a shop like this", "might"), classify it as OPINION, never STATISTIC/FACT/PRODUCT_CLAIM/MARKET_CLAIM, since it was deliberately written as an illustrative example, not a verified measurement. Only use STATISTIC/FACT/PRODUCT_CLAIM/MARKET_CLAIM when the sentence asserts something as real, current, measured fact.

Return ONLY this JSON:
{
  "hook": "two punchy sentences directly attacking the acute pain point",
  "body": "the fully edited article, retaining useful ## headings and minimal structural markdown",
  "claims": [
    {
      "claim_text": "verbatim claim sentence",
      "claim_type": "STATISTIC|FACT|CUSTOMER_RESULT|MARKET_CLAIM|PRODUCT_CLAIM|OPINION",
      "source_url": "string or null",
      "source_title": "string or null",
      "source_date": "string or null"
    }
  ],
  "forbidden_hits": []
}

Return ONLY valid JSON. No markdown code fences.`;

  const userMessage = `Hook:
${hookText}

Draft Body:
${bodyText}

Brand Context:
${brandContext}

Supplied Evidence:
${evidenceBlock}`;

  return {
    model: "qwen3.7-flash",
    enable_thinking: false,
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: editorSystemPrompt },
      { role: "user", content: userMessage },
    ],
  };
}
