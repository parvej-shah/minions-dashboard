const existingRows = $('Backlog Guard').first().json.existing_rows || [];
// /api/brand/context returns ONE object with the directives nested under
// `directives`. Filtering the raw input for a top-level `category` matched
// nothing, so every refine ran with an empty Brand context.
const brandCtx = $input.first()?.json || {};
const brandItems = (Array.isArray(brandCtx.directives) ? brandCtx.directives : []).filter(r => r && r.category);

// Filter brand rows for priority 1 and 2 (includes IDENTITY, FORBIDDEN, PROOF)
const filteredBrand = brandItems.filter(r => {
  const prio = parseInt(r.priority, 10);
  return prio === 1 || prio === 2;
});

const brandContext = filteredBrand.map(r => `[${r.category}] ${r.key}: ${r.content}`).join('\n');

const newRows = existingRows.filter(r => (r.status || '').trim().toUpperCase() === 'NEW');

if (newRows.length === 0) {
  return [{
    json: {
      has_new: false,
      count: 0
    }
  }];
}

const systemPrompt = `You are the idea refiner for the current tenant's brand. Use the supplied Brand Context as the source of truth.
Your job is to take raw, unshaped notes entered by a human team member and sharpen each into a strategic content idea.

Brand context:
${brandContext}

Rules:
- NEVER use em dashes ('—' or '--') anywhere. Use commas, periods, or parentheses.
- Make the idea specific and useful, but do not force contrarian framing or operational friction when the source note calls for a story, observation, tutorial, or reflective point.
- Never invent evidence, results, statistics, customer anecdotes, or market facts.

Return a valid JSON array of objects with schema:
[
  {
    "row_index": number (0-based matching input array),
    "idea_id": string,
    "angle": "sharp one-sentence angle",
    "audience": "ICP" | "PEER" | "BRIDGE",
    "pillar": "Operational Focus" | "AI Strategy" | "Building in Public" | "Contractor Realities",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "batch_rank": number (1-3 relative rank),
    "evidence_required": "Y" | "N",
    "why": "one sentence explaining why this angle works",
    "icp_relevance": number (1-5)
  }
]
No preamble, no markdown fences.`;

return [{
  json: {
    has_new: true,
    count: newRows.length,
    new_rows: newRows,
    prompt_payload: {
      model: "qwen-flash",
      enable_thinking: false,
      temperature: 0.6,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Raw ideas to refine:\n${JSON.stringify(newRows, null, 2)}` }
      ]
    }
  }
}];
