const brand = $('Fetch Brand Context').first().json || {};
const directiveRows = $('Read Brand').all().map(item => item.json).filter(row => row && row.category);
const toneRows = $('Fetch Tone Examples').all().map(item => item.json).filter(row => row && row.content);
const target = $('Select Target').first().json;
const targetAudience = (target.audience || 'ICP').toUpperCase();

// Deterministic hook-archetype selection by pillar, computed here rather than left to
// the model's discretion
const pillarLower = (target.pillar || '').toLowerCase();
let hookArchetype, archetypeInstruction;
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

const filtered = directiveRows.filter(r => {
  const scope = (r.audience_scope || 'ALL').toUpperCase();
  const priority = parseInt(r.priority, 10);
  const scopeMatch = scope === 'ALL' || scope === targetAudience;
  const prioMatch = priority === 1 || priority === 2;
  return scopeMatch && prioMatch;
});

function parseApprovedProof(row) {
  if ((row.category || '').toUpperCase() !== 'PROOF') return null;
  try {
    const proof = JSON.parse(row.content || '');
    const url = new URL(proof.sourceUrl || '');
    if (proof.approved !== true || !proof.claim || !['http:', 'https:'].includes(url.protocol)) return null;
    return { claim: String(proof.claim).trim(), sourceUrl: url.toString(), sourceTitle: String(proof.sourceTitle || '').trim() };
  } catch { return null; }
}
const approvedProofs = filtered.map(parseApprovedProof).filter(Boolean);
const profileLines = [
  brand.positioning ? `[POSITIONING] ${brand.positioning}` : '',
  brand.tone_formality ? `[VOICE] Formality: ${brand.tone_formality}` : '',
  brand.tone_cadence ? `[VOICE] Cadence: ${brand.tone_cadence}` : '',
  Array.isArray(brand.allowed_proof_claims) && brand.allowed_proof_claims.length ? `[CLAIM_GUIDANCE_UNSOURCED] ${brand.allowed_proof_claims.join('; ')}` : ''
].filter(Boolean);
const directiveLines = filtered.filter(r => (r.category || '').toUpperCase() !== 'PROOF').map(r => `[${r.category}] ${r.key}: ${r.content}`);
const proofLines = approvedProofs.map(p => `[VERIFIED_BRAND_PROOF] Claim: ${p.claim} | Source: ${p.sourceTitle || new URL(p.sourceUrl).hostname} | URL: ${p.sourceUrl}`);
const brandContext = [...profileLines, ...directiveLines, ...proofLines].join('\n');
const cappedBrand = brandContext.length > 8000 ? brandContext.substring(0, 8000) : brandContext;

// The AUTHOR's standing in their field. Constrains what the draft may claim as
// evidence -- whether first-person operational claims are available at all --
// and how assertive it may be. This is NOT reading level: how technical the
// piece gets comes from the positioning/ICP directives in brandContext above.
// Until now the writer ignored this entirely, so a beginner's drafts were free
// to invent war stories the author had never lived.
const writerStanding = brand.writer_expertise_guidance || '';

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

return [{
  json: {
    idea: target,
    brand_context: cappedBrand,
    company_name: brand.brand_name || 'the brand',
    client_id: $('Generate run_id').first().json.client_id || 'tenant-zero-getminions-ai',
    primary_logo_url: brand.primary_logo_url || '',
    brand_teal: brand.brand_teal || '#0E5C63',
    brand_coral: brand.brand_coral || '#FF6B4A',
    primary_ink: brand.primary_ink || '#12242A',
    visual_assets: brand.visual_assets || {},
    tone_questionnaire: brand.tone_questionnaire || null,
    tone_examples: toneRows.slice(0, 5).map(row => row.content),
    allow_customer_result_claims: !!brand.allow_customer_result_claims,
    prompt_payload: {
      model: "qwen3.7-max",
      enable_thinking: false,
      temperature: 0.5,
      max_tokens: 2000,
      messages: [
        { role: "system", content: strategistSystemPrompt },
        { role: "user", content: userMessage }
      ]
    }
  }
}];
