const brand = $('Fetch Brand Context').first().json || {};
const directiveRows = $('Read Brand').all().map(item => item.json).filter(row => row && row.category);
const toneRows = $('Fetch Tone Examples').all().map(item => item.json).filter(row => row && row.content);
const target = $('Select Target').first().json;

// One ICP per tenant: only ALL and ICP directives apply. PEER/BRIDGE were
// retired on 2026-09-23, and an old idea still labelled PEER must not pull
// in a retired lane's rules.
const filtered = directiveRows.filter(r => {
  const scope = (r.audience_scope || 'ALL').toUpperCase();
  const priority = parseInt(r.priority, 10);
  const scopeMatch = scope === 'ALL' || scope === 'ICP';
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
//
// It comes from the dashboard's author context: brand_profile has no
// writer_expertise_guidance column, so the old read here was always empty.
const author = $('Fetch Author Context').first().json.author || {};
const writerStanding = author.writer_standing || '';

// The strategist prompt is rendered by the dashboard (src/lib/prompts/strategist.ts).
// The hook, the allowed content modes and the author's experience come in
// `author` (POST /api/internal/drafts/context), decided there in code.
return [{
  json: {
    idea: target,
    brand_context: cappedBrand,
    company_name: brand.brand_name || 'the brand',
    client_id: $('Generate run_id').first().json.client_id,
    primary_logo_url: brand.primary_logo_url || '',
    brand_teal: brand.brand_teal || '#0E5C63',
    brand_coral: brand.brand_coral || '#FF6B4A',
    primary_ink: brand.primary_ink || '#12242A',
    // Read by Parse Variants for the cover's background and corner icon. They
    // were never passed on, so every cover used hardcoded colors while the
    // Brand look editor previewed the tenant's own.
    brand_cream: brand.brand_cream || '#FFF8F0',
    accent_blue: brand.accent_blue || '#3A6EA5',
    visual_assets: brand.visual_assets || {},
    tone_questionnaire: brand.tone_questionnaire || null,
    tone_examples: toneRows.slice(0, 5).map(row => row.content),
    allow_customer_result_claims: !!brand.allow_customer_result_claims,
    author: author,
    prompt_inputs: {
      brand_name: brand.brand_name,
      target: {
        idea_id: target.idea_id,
        audience: target.audience,
        pillar: target.pillar,
        raw_idea: target.raw_idea,
        angle: target.angle,
        why: target.why
      },
      brand_context: cappedBrand,
      writer_standing: writerStanding,
      author: author
    }
  }
}];
