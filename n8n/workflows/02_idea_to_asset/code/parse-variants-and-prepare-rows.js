const rawInput = $input.all()[0]?.json || {};
let brandCtx = {};
try { brandCtx = $('Assemble Brand Context').first().json || {}; } catch (e) {}
const brandCompanyName = brandCtx.company_name || 'the brand';
const brandInk = brandCtx.primary_ink || '#12242A';
const brandTeal = brandCtx.brand_teal || '#0E5C63';
const brandCoral = brandCtx.brand_coral || '#FF6B4A';
const brandCream = brandCtx.brand_cream || '#F5F7FA';
const accentBlue = brandCtx.accent_blue || '#7C8CFF';
const gateData = $('Parse Claims and Gate').first().json;
const strategyData = $('Parse Strategy JSON').first().json?.strategy || {};
const ideaData = $('Select Target').first().json || {};

let liVariant = '';
let fbVariant = '';
let xVariant = '';

if (rawInput.choices && rawInput.choices[0] && rawInput.choices[0].message) {
  let content = rawInput.choices[0].message.content || '';
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(content);
    liVariant = parsed.li_variant || '';
    fbVariant = parsed.fb_variant || '';
    xVariant = parsed.x_variant || '';
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

const nowIso = new Date().toISOString();
const docTitle = `[${gateData.audience}] ${cleanedTitle} (${gateData.asset_id})`;

const slug = cleanedTitle
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, "")
  .replace(/[\s_-]+/g, "-")
  .replace(/^-+|-+$/g, "");

const publicBlogUrl = `https://getminions.ai/blog/${slug}`;

// Minimalist Stripe/Linear Commercial Cover Card
const visualCard = strategyData.thumbnail_card || {};
const cardHeadline = visualCard.headline || cleanedTitle.toUpperCase();

// Dynamic, Topic-Specific Physical Props & Scene
let physicalProps = visualCard.physical_scene || visualCard.visual_prompt || '';
const visualRegister = (visualCard.visual_register || '').toUpperCase();
const combinedContext = (cleanedTitle + ' ' + (ideaData.raw_idea || '') + ' ' + (ideaData.angle || '') + ' ' + (ideaData.target_trade || '')).toLowerCase();
const PHYSICAL_TRADES = ['hvac', 'plumbing', 'electrical', 'roofing', 'pest control'];
const isPhysicalTradeAccount = PHYSICAL_TRADES.includes((ideaData.target_trade || '').toLowerCase());

// Data/strategy/software topics (latency, pricing, architecture, etc.) get a
// context-matched abstract studio composition instead of literal wrenches, even
// when the reader's trade label is HVAC/Plumbing/etc. 
function abstractDataProps() {
  // AI/agent/conversation posts landed on the generic dashboard fallback, which
  // is why an article arguing against conversational UX got no visual tie to
  // its own subject. Checked first so it wins over the broader 'automation'
  // and 'workflow' matches further down.
  if (combinedContext.includes('conversation') || combinedContext.includes('chatbot') || combinedContext.includes('agent') || combinedContext.includes(' ai ') || combinedContext.includes('prompt') || combinedContext.includes('llm') || combinedContext.includes('intent')) {
    return 'A small, minimal line-art glyph in the bottom-right corner only: a simple rounded chat-bubble outline with a single checkmark inside, rendered in thin ' + accentBlue + ' strokes on transparent ground. No monitors, no printed documents, no photographed hardware -- a small icon only, a supporting detail, not the main composition.';
  }
  if (combinedContext.includes('voice') || combinedContext.includes('call') || combinedContext.includes('latency') || combinedContext.includes('telecom') || combinedContext.includes('audio') || combinedContext.includes('phone') || combinedContext.includes('dispatch')) {
    return 'A small, minimal line-art glyph in the bottom-right corner only: a simple soundwave icon inside a rounded call-bubble outline, rendered in thin ' + accentBlue + ' strokes on transparent ground. No monitors, no tablets, no printed diagrams -- a small icon only, a supporting detail, not the main composition.';
  }
  if (combinedContext.includes('price') || combinedContext.includes('pricing') || combinedContext.includes('revenue') || combinedContext.includes('cost') || combinedContext.includes('econom') || combinedContext.includes('margin') || combinedContext.includes('roi')) {
    return 'A small, minimal line-art glyph in the bottom-right corner only: a simple upward bar-chart icon with one bar filled solid in ' + accentBlue + ', thin outline strokes on transparent ground. No monitors, no ledgers, no invoices -- a small icon only, a supporting detail, not the main composition.';
  }
  if (combinedContext.includes('architect') || combinedContext.includes('system') || combinedContext.includes('infrastructure') || combinedContext.includes('pipeline') || combinedContext.includes('workflow') || combinedContext.includes('automation')) {
    return 'A small, minimal line-art glyph in the bottom-right corner only: three simple connected-node dots forming a small flow diagram, rendered in thin ' + accentBlue + ' strokes on transparent ground. No monitors, no blueprints, no geometric object clusters -- a small icon only, a supporting detail, not the main composition.';
  }
  return 'A small, minimal line-art glyph in the bottom-right corner only: a simple dashboard-card icon with a single checkmark, rendered in thin ' + accentBlue + ' strokes on transparent ground. No monitors, no printed pages, no brass objects -- a small icon only, a supporting detail, not the main composition.';
}

function physicalTradeProps() {
  if (combinedContext.includes('slab') || combinedContext.includes('leak') || combinedContext.includes('pipe') || combinedContext.includes('plumb') || combinedContext.includes('water')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple wrench crossed with a water-droplet outline, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  } else if (combinedContext.includes('attic') || combinedContext.includes('heat') || combinedContext.includes('capacitor') || combinedContext.includes('compressor') || combinedContext.includes('hvac') || combinedContext.includes('refrigerant')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple gauge-dial outline with a temperature glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  } else if (combinedContext.includes('voice') || combinedContext.includes('call') || combinedContext.includes('telecom') || combinedContext.includes('latency') || combinedContext.includes('audio') || combinedContext.includes('phone')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple headset outline with a soundwave glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  } else if (combinedContext.includes('electric') || combinedContext.includes('wire') || combinedContext.includes('volt') || combinedContext.includes('panel') || combinedContext.includes('breaker')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple lightning-bolt outline inside a circuit-node glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  } else if (combinedContext.includes('roof') || combinedContext.includes('storm') || combinedContext.includes('hail') || combinedContext.includes('flashing')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple house-roof outline with a shield glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  } else if (combinedContext.includes('pest') || combinedContext.includes('termite') || combinedContext.includes('moisture')) {
    return 'A small, single line-art icon in the bottom-right corner only: a simple magnifying-glass outline over a leaf glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
  }
  return 'A small, single line-art icon in the bottom-right corner only: a simple gear-and-checkmark glyph, rendered in thin ' + brandTeal + ' strokes on transparent ground. Not a photograph, not a full flat-lay, not multiple objects -- one small icon only, a supporting detail, not the main composition.';
}

// The strategist LLM fills thumbnail_card.physical_scene, and it reaches for
// trade hardware (multimeters, manifold gauges, wire strippers) even when the
// post is about software or strategy -- it sees a B2B-operations brand and
// pattern-matches to the field. Trusting it unconditionally is what put a bench
// of electrical test gear on "Natural Conversation Is an Anti-Pattern in
// Enterprise AI" (target_trade UNSPECIFIED, no trade keyword anywhere in the
// idea). The keyword routing below was never consulted, because a non-empty
// physical_scene skipped the whole block.
const TRADE_HARDWARE = ['multimeter', 'manifold gauge', 'refrigerant', 'wire stripper', 'busbar', 'circuit breaker', 'pipe leak detector', 'brass fitting', 'borescope', 'moisture detector', 'thermal camera', 'shingle', 'micrometer', 'test probe', 'wrench', 'pressure gauge'];
const mentionsTradeHardware = TRADE_HARDWARE.some(t => (physicalProps || '').toLowerCase().includes(t));

// An abstract-topic post must never be illustrated with physical trade gear.
// Falling back to the keyword router gives it a scene matched to what the post
// is actually about.
const propsAreOffTopic = mentionsTradeHardware && !isPhysicalTradeAccount && visualRegister !== 'PHYSICAL_TRADE';

if (!physicalProps || physicalProps.toLowerCase().includes('clipboard') || physicalProps.length < 25 || propsAreOffTopic) {
  if (visualRegister === 'ABSTRACT_DATA' || (!isPhysicalTradeAccount && visualRegister !== 'PHYSICAL_TRADE')) {
    physicalProps = abstractDataProps();
  } else {
    physicalProps = physicalTradeProps();
  }
}

const kickerRaw = (visualCard.subtitle || strategyData.narrative_thread || '').trim();
const kicker = kickerRaw.replace(/^./, c => c.toUpperCase());
const kickerSentence = kicker ? kicker.split(/(?<=[.!?])\s/)[0] : '';
// Cut at the last word boundary before the limit, never mid-word, and only
// add an ellipsis when text was actually removed (the mid-word 'when co'
// cutoff on the first live render was a plain .slice(0, 70) bug).
const KICKER_MAX = 90;
const kickerLine = kickerSentence.length <= KICKER_MAX
  ? kickerSentence
  : kickerSentence.slice(0, KICKER_MAX).replace(/\s+\S*$/, '').trim() + '…';

const minimalistStudioPrompt = `High-end editorial blog cover and thumbnail (16:9 widescreen, 1K resolution, clean commercial graphic design, NOT photorealistic studio photography):

Background & Canvas: Warm, light, off-white/cream backdrop (${brandCream}), evenly lit, minimal texture, soft and airy. Generous negative space. Never dark, never a studio table, never a photographic backdrop.

Typography & Branding (Type-Led -- this is the dominant element of the entire composition, filling most of the left/center of the frame):
1. Bold Headline: Large, bold, ultra-clean geometric sans-serif headline: "${cardHeadline}" filling the left ~60% of the frame, tight kerning, generous line spacing. Render it mostly in solid high-contrast near-black (${brandInk}), except render the single most important word of the headline in solid ${brandCoral} for emphasis, exactly like a magazine pull-quote.
${kickerLine ? `2. Small Kicker Line: One short line of regular-weight text directly beneath the headline, in a muted gray, roughly a third the headline's size: "${kickerLine}"
3` : '2'}. Small Top-Right Brand Wordmark: a small, sharp, high-contrast wordmark reading "${brandCompanyName}" in solid ${brandInk} with tight, clean letterforms. Keep it modest in size, never competing with the headline.

Secondary Visual Accent (small, corner-positioned, NEVER the focal point -- a quiet supporting detail only, no larger than roughly 12% of the frame's width and height combined):
${physicalProps}
Render it as a single flat, thin two-color line icon with no shading, no gradients, no drop shadow, no 3D pedestal or perspective -- flat vector iconography, not a small illustration or product render.

STRICT TEXT RULE: The headline${kickerLine ? ', the kicker line,' : ''} and the wordmark are the ONLY text allowed anywhere in the image. Do NOT render any badges, tags, category pills, author name, byline, date, caption, watermark, or fine print. If you are not certain an element belongs to those, omit it entirely.

Aesthetic Style: The exact editorial standard of a modern SaaS/dev-tools blog (Stripe, Linear, Wall Street Journal digital covers): light, minimal, bold confident typography that carries the design, huge negative space, one small quiet supporting graphic. No dark studio tables, no flat-lay of physical objects, no holograms, no glowing effects, no stock-photo product-shot look, no clutter.`;

const docContent = 
`================================================================================
TITLE: ${cleanedTitle.toUpperCase()}
================================================================================
ASSET ID: ${gateData.asset_id}
AUDIENCE: ${gateData.audience}
CLAIMS GATE: ${gateData.claims_ok}
DATE: ${nowIso.substring(0, 10)}
LIVE URL: ${publicBlogUrl}
COVER ENGINE: Qwen-Image-3.0 (Dynamic Topic Props + Minimalist Typography + Brand Wordmark)
BRAND WORDMARK: ${brandCompanyName}
COVER PROMPT: ${minimalistStudioPrompt}
================================================================================

🎯 THE INVERSION HOOK:
${cleanedHook}

💡 CORE ARGUMENT:
${cleanedCoreArg || cleanedTitle}

________________________________________________________________________________

📖 FULL 5-STAGE STRIPE/LINEAR ARTICLE DRAFT:

${fullBodyText}

________________________________________________________________________________

📱 PLATFORM VARIANT 1 (LINKEDIN - Copy & Paste):

${cleanedLi || 'None'}

💬 LINKEDIN FIRST COMMENT:
👉 Read the full breakdown & operational field guide: ${publicBlogUrl}

________________________________________________________________________________

📱 PLATFORM VARIANT 2 (FACEBOOK - Auto-Published with Photo):

${cleanedFb || 'None'}

💬 FACEBOOK FIRST COMMENT:
👉 Read our complete field playbook: ${publicBlogUrl}

________________________________________________________________________________

📱 PLATFORM VARIANT 3 (TWITTER / X - Copy & Paste):

${cleanedX || 'None'}

💬 TWITTER FIRST REPLY THREAD:
👉 Read the full operational field guide: ${publicBlogUrl}
`;

const docsBatchPayload = {
  requests: [
    {
      insertText: {
        location: { index: 1 },
        text: docContent
      }
    }
  ]
};

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
    image_prompt: minimalistStudioPrompt,
    card_headline: cardHeadline,
    claims_ok: gateData.claims_ok,
    audience: gateData.audience,
    title: cleanedTitle,
    asset_id: gateData.asset_id,
    li_variant: cleanedLi,
    fb_variant: cleanedFb,
    x_variant: cleanedX,
    edited_body: fullBodyText,
    now_iso: nowIso,
    docs_batch_payload: docsBatchPayload,
    supabase_payload: supabasePayload,
    doc_create_payload: {
      name: docTitle,
      mimeType: "application/vnd.google-apps.document"
    }
  }
}];
