import type { ChatPayload, Json } from "./types";
import { CONTENT_ANGLES } from "@/constants/contentAngles";

/** 01_idea_harvester › Build Refine Payload */
export interface RefineInput {
  /** `directives` from GET /api/brand/context. */
  directives: { category?: string; key?: string; content?: string; priority?: number | string }[];
  /** The NEW idea rows a person typed in, to be sharpened. */
  new_rows: Json[];
  /**
   * `content_lanes` from GET /api/brand/context. Each idea is assigned to one
   * of the TENANT's lanes. This replaced four pillars that were hardcoded for
   * every tenant, one of them tenant zero's own trade pillar.
   */
  lanes?: { name: string; brief?: string }[];
}

export function renderRefine(input: RefineInput): ChatPayload {
  const brandItems = (input.directives || []).filter((r) => r && r.category);
  // Priority 1 and 2 only (includes IDENTITY, FORBIDDEN, PROOF).
  const filteredBrand = brandItems.filter((r) => {
    const prio = parseInt(String(r.priority), 10);
    return prio === 1 || prio === 2;
  });
  const brandContext = filteredBrand.map((r) => `[${r.category}] ${r.key}: ${r.content}`).join("\n");
  const newRows = input.new_rows || [];
  const lanes = (input.lanes || []).filter((l) => l && l.name);
  const laneBlock = lanes.length
    ? `\n\nContent lanes (what this brand publishes; put each idea in the one it serves best):\n${lanes.map((l) => `- ${l.name}: ${l.brief || ""}`).join("\n")}`
    : "";
  const laneField = lanes.length ? `\n    "lane": ${lanes.map((l) => JSON.stringify(l.name)).join(" | ")},` : "";
  // The pillar is the idea's rhetorical angle, from the same library the
  // harvester rotates through, so the strategist's hook choice works for both.
  const pillarField = CONTENT_ANGLES.map((a) => JSON.stringify(a.pillar)).join(" | ");

  const systemPrompt = `You are the idea refiner for the current tenant's brand. Use the supplied Brand Context as the source of truth.
Your job is to take raw, unshaped notes entered by a human team member and sharpen each into a strategic content idea.

Brand context:
${brandContext}${laneBlock}

Rules:
- NEVER use em dashes ('—' or '--') anywhere. Use commas, periods, or parentheses.
- Make the idea specific and useful, but do not force contrarian framing or operational friction when the source note calls for a story, observation, tutorial, or reflective point.
- Never invent evidence, results, statistics, customer anecdotes, or market facts.

Return a valid JSON array of objects with schema:
[
  {
    "row_index": number (0-based matching input array),
    "idea_id": string,
    "angle": "sharp one-sentence angle",${laneField}
    "pillar": ${pillarField},
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "batch_rank": number (1-3 relative rank),
    "evidence_required": "Y" | "N",
    "why": "one sentence explaining why this angle works",
    "icp_relevance": number (1-5)
  }
]
No preamble, no markdown fences.`;

  return {
    model: "qwen-flash",
    enable_thinking: false,
    temperature: 0.6,
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Raw ideas to refine:\n${JSON.stringify(newRows, null, 2)}` },
    ],
  };
}
