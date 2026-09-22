const editorData = $('Parse Editor Output').first().json;
const idea = editorData.idea || $('Select Target').first().json;
const strategy = editorData.strategy || {};
const brandCtx = $('Assemble Brand Context').first().json;
const companyName = brandCtx.company_name || 'the brand';
const allowCustomerResultClaims = !!brandCtx.allow_customer_result_claims;
const hook = editorData.hook || strategy.hook || '';
const editedBody = editorData.edited_body || '';
const rawClaims = editorData.claims || [];

const brandRows = $('Read Brand').all().map(i => i.json).filter(r => r && r.category);
const proofRows = brandRows.filter(r => (r.category || '').toUpperCase() === 'PROOF');
const approvedProofs = proofRows.flatMap(row => {
  try {
    const proof = JSON.parse(row.content || '');
    const url = new URL(proof.sourceUrl || '');
    return proof.approved === true && proof.claim && ['http:', 'https:'].includes(url.protocol)
      ? [{ claim: String(proof.claim), sourceUrl: url.toString(), sourceTitle: String(proof.sourceTitle || '') }]
      : [];
  } catch { return []; }
});
const stopWords = new Set(['that','this','with','from','have','your','their','will','into','more','than','when','where','what','which','were','been','being','over','under','about']);
function significantWords(text) {
  return [...new Set(String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(word => word.length > 3 && !stopWords.has(word)))];
}
function matchingProof(claimText) {
  const claimWords = significantWords(claimText);
  return approvedProofs.find(proof => {
    const proofWords = significantWords(proof.claim);
    const overlap = proofWords.filter(word => claimWords.includes(word)).length;
    return overlap >= 3 && overlap / Math.max(1, Math.min(proofWords.length, claimWords.length)) >= 0.4;
  }) || null;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const assetId = generateUUID();
const nowIso = new Date().toISOString();

let hasCustomerResult = false;
let hasUnverifiedExternal = false;
let hasUnbackedProduct = false;

const formattedClaims = rawClaims.map((claim, idx) => {
  const claimId = generateUUID();
  const cType = (claim.claim_type || 'OPINION').toUpperCase();
  const cText = (claim.claim_text || '').toLowerCase();

  const proof = cType === 'OPINION' ? null : matchingProof(cText);
  if (cType === 'CUSTOMER_RESULT' && (!allowCustomerResultClaims || !proof)) hasCustomerResult = true;
  if (['STATISTIC', 'FACT', 'MARKET_CLAIM'].includes(cType) && !proof) hasUnverifiedExternal = true;
  if (cType === 'PRODUCT_CLAIM' && !proof) hasUnbackedProduct = true;

  return {
    claim_id: claimId,
    asset_id: assetId,
    claim_text: claim.claim_text || '',
    claim_type: cType,
    source_url: proof?.sourceUrl || '',
    source_title: proof?.sourceTitle || '',
    source_date: '',
    verified: cType === 'OPINION' ? 'NA' : proof ? 'Y' : 'N',
    checked_by: 'agent',
    checked_at: nowIso
  };
});

let claimsOk = 'Y';
if (hasCustomerResult) {
  claimsOk = 'BLOCKED';
} else if (hasUnverifiedExternal || hasUnbackedProduct) {
  claimsOk = 'N';
}

const audience = (idea.audience || 'ICP').toUpperCase();
const brandContext = brandCtx.brand_context || '';
const toneExamples = Array.isArray(brandCtx.tone_examples) ? brandCtx.tone_examples : [];
const toneQuestionnaire = brandCtx.tone_questionnaire || null;

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
Title: ${strategy.title || idea.angle}`;

return [{
  json: {
    asset_id: assetId,
    idea_id: idea.idea_id,
    audience: audience,
    title: strategy.title || idea.angle || 'Untitled Draft',
    hook: hook,
    core_argument: strategy.core_argument || '',
    edited_body: editedBody,
    claims_ok: claimsOk,
    claims: formattedClaims,
    prompt_payload: {
      model: "qwen-flash",
      enable_thinking: false,
      temperature: 0.55,
      max_tokens: 2500,
      messages: [
        { role: "system", content: variantsSystemPrompt },
        { role: "user", content: userMessage }
      ]
    }
  }
}];
