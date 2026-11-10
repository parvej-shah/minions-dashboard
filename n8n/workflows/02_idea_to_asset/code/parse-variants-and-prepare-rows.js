// Models regularly put raw line breaks inside JSON strings, which JSON.parse
// rejects. Mirrors parseModelJson in src/lib/modelJson.ts; keep in sync.
function parseModelJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    let out = '';
    let inString = false;
    let escaped = false;
    for (const ch of cleaned) {
      if (!inString) {
        if (ch === '"') inString = true;
        out += ch;
      } else if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === '\\') {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === '\n') out += '\\n';
      else if (ch === '\t') out += '\\t';
      else if (ch !== '\r') out += ch;
    }
    return JSON.parse(out);
  }
}

const rawInput = $input.all()[0]?.json || {};
const gateData = $('Parse Claims and Gate').first().json;
const strategyData = $('Parse Strategy JSON').first().json?.strategy || {};

let liVariant = '';
let fbVariant = '';
let xVariant = '';
let igVariant = '';

if (rawInput.choices && rawInput.choices[0] && rawInput.choices[0].message) {
  let content = rawInput.choices[0].message.content || '';
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = parseModelJson(content);
    liVariant = parsed.li_variant || '';
    fbVariant = parsed.fb_variant || '';
    xVariant = parsed.x_variant || '';
    igVariant = parsed.ig_variant || '';
  } catch (e) {}
}

function cleanText(txt) {
  return (txt || '')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*--\s*/g, ', ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^###\s+/gm, '')
    .replace(/^##\s+/gm, '')
    .replace(/^#\s+/gm, '')
    .replace(/`+/g, '')
    .trim();
}

const fullBodyText = gateData.edited_body || gateData.draft_body || '';
const cleanedTitle = cleanText(gateData.title);
const cleanedHook = cleanText(gateData.hook) || cleanText(fullBodyText.split('\n\n')[0] || '');
const cleanedCoreArg = cleanText(gateData.core_argument);

const cleanedFb = cleanText(fbVariant);

const cleanedLi = cleanText(liVariant);

const cleanedX = cleanText(xVariant);

const cleanedIg = cleanText(igVariant);

const nowIso = new Date().toISOString();
const docTitle = `[${gateData.audience}] ${cleanedTitle} (${gateData.asset_id})`;

const slug = cleanedTitle
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, "")
  .replace(/[\s_-]+/g, "-")
  .replace(/^-+|-+$/g, "");

// Render Cover sends cover_inputs.thumbnail_card to /api/internal/covers,
// which draws the cover in code.
const visualCard = strategyData.thumbnail_card || {};
const cardHeadline = visualCard.headline || cleanedTitle.toUpperCase();
const coverInputs = { thumbnail_card: visualCard };

const supabasePayload = {
  slug: slug,
  title: cleanedTitle,
  hook: cleanedHook,
  core_argument: cleanedCoreArg,
  content: fullBodyText,
  audience: gateData.audience,
  pillar: "Operations",
  tags: [gateData.audience, "Operations"],
  asset_id: gateData.asset_id,
  meta_description: (cleanedHook || cleanedTitle).slice(0, 160)
};

return [{
  json: {
    claims_rows: gateData.claims,
    idea_id: gateData.idea_id,
    doc_title: docTitle,
    slug: slug,
    cover_inputs: coverInputs,
    card_headline: cardHeadline,
    claims_ok: gateData.claims_ok,
    audience: gateData.audience,
    title: cleanedTitle,
    asset_id: gateData.asset_id,
    li_variant: cleanedLi,
    fb_variant: cleanedFb,
    x_variant: cleanedX,
    ig_variant: cleanedIg,
    edited_body: fullBodyText,
    now_iso: nowIso,
    supabase_payload: supabasePayload
  }
}];
