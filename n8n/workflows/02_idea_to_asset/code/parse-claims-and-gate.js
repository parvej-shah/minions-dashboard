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

// The variants prompt is rendered by the dashboard (src/lib/prompts/variants.ts).
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
    prompt_inputs: {
      company_name: companyName,
      hook: hook,
      edited_body: editedBody,
      brand_context: brandContext,
      tone_questionnaire: toneQuestionnaire,
      tone_examples: toneExamples,
      audience: audience,
      title: strategy.title || idea.angle
    }
  }
}];
