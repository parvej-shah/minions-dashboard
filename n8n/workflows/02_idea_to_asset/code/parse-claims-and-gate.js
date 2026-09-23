// The claims gate runs in the dashboard now (POST /api/internal/drafts/check,
// src/lib/drafts/check.ts): proof matching, figures checked in code rather
// than only the claims the editor chose to extract, Generalize leaks, and
// first-person claims with no experience behind them.
const check = $input.first().json || {};
if (!['Y', 'N', 'BLOCKED'].includes(check.claims_ok)) {
  throw new Error('The draft check returned no verdict: ' + JSON.stringify(check).slice(0, 300));
}

const editorData = $('Parse Editor Output').first().json;
const idea = editorData.idea || $('Select Target').first().json;
const strategy = editorData.strategy || {};
const brandCtx = $('Assemble Brand Context').first().json;
const companyName = brandCtx.company_name || 'the brand';
const allowCustomerResultClaims = !!brandCtx.allow_customer_result_claims;
const hook = editorData.hook || strategy.hook || '';


function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const assetId = generateUUID();
const nowIso = new Date().toISOString();

const formattedClaims = (check.claims || []).map(claim => ({
  claim_id: generateUUID(),
  asset_id: assetId,
  claim_text: claim.claim_text || '',
  claim_type: claim.claim_type || 'OPINION',
  source_url: claim.source_url || '',
  source_title: claim.source_title || '',
  source_date: '',
  verified: claim.verified || 'N',
  checked_by: 'agent',
  checked_at: nowIso
}));

const claimsOk = check.claims_ok;
// The check splits over-long paragraphs in code; save its body.
const editedBody = check.body || editorData.edited_body || '';
// For the reviewer: why it is blocked or needs review, then readability notes.
const reviewNotes = [...(check.reasons || []), ...(check.review_notes || [])];

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
    review_notes: reviewNotes,
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
