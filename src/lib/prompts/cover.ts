/** 02_idea_to_asset › Parse Variants and Prepare Rows, rendered for 04_hero_image */
export interface CoverInput {
  company_name: string;
  colors: { primary_ink?: string; brand_teal?: string; brand_coral?: string; brand_cream?: string; accent_blue?: string };
  /** The strategist's thumbnail_card. */
  thumbnail_card: { headline?: string; subtitle?: string; visual_register?: string; physical_scene?: string; visual_prompt?: string };
  narrative_thread?: string;
  /** The cleaned article title. */
  title: string;
  raw_idea?: string;
  angle?: string;
  target_trade?: string;
}

/**
 * The type-led 16:9 cover prompt for Qwen Image 3.0 Pro. The corner icon is
 * the strategist's physical_scene unless that is missing, too short, or shows
 * trade hardware on a non-trade topic -- then a keyword router picks one.
 */
export function renderCover(input: CoverInput): { image_prompt: string; card_headline: string } {
  const brandCompanyName = input.company_name || "the brand";
  const brandInk = input.colors?.primary_ink || "#12242A";
  const brandTeal = input.colors?.brand_teal || "#0E5C63";
  const brandCoral = input.colors?.brand_coral || "#FF6B4A";
  const brandCream = input.colors?.brand_cream || "#F5F7FA";
  const accentBlue = input.colors?.accent_blue || "#7C8CFF";
  const cleanedTitle = input.title || "";
  const strategyData = { narrative_thread: input.narrative_thread };
  const ideaData = { raw_idea: input.raw_idea, angle: input.angle, target_trade: input.target_trade };

  const visualCard = input.thumbnail_card || {};
  const cardHeadline = visualCard.headline || cleanedTitle.toUpperCase();

  // Topic-matched corner icon.
  let physicalProps = visualCard.physical_scene || visualCard.visual_prompt || "";
  const visualRegister = (visualCard.visual_register || "").toUpperCase();
  const combinedContext = (cleanedTitle + " " + (ideaData.raw_idea || "") + " " + (ideaData.angle || "") + " " + (ideaData.target_trade || "")).toLowerCase();
  const PHYSICAL_TRADES = ["hvac", "plumbing", "electrical", "roofing", "pest control"];
  const isPhysicalTradeAccount = PHYSICAL_TRADES.includes((ideaData.target_trade || "").toLowerCase());

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

  // The strategist reaches for trade hardware (multimeters, manifold gauges)
  // even on software or strategy posts, because it sees a B2B-operations
  // brand. An abstract-topic post must never be illustrated with trade gear.
  const TRADE_HARDWARE = ["multimeter", "manifold gauge", "refrigerant", "wire stripper", "busbar", "circuit breaker", "pipe leak detector", "brass fitting", "borescope", "moisture detector", "thermal camera", "shingle", "micrometer", "test probe", "wrench", "pressure gauge"];
  const mentionsTradeHardware = TRADE_HARDWARE.some((t) => (physicalProps || "").toLowerCase().includes(t));
  const propsAreOffTopic = mentionsTradeHardware && !isPhysicalTradeAccount && visualRegister !== "PHYSICAL_TRADE";

  if (!physicalProps || physicalProps.toLowerCase().includes("clipboard") || physicalProps.length < 25 || propsAreOffTopic) {
    if (visualRegister === "ABSTRACT_DATA" || (!isPhysicalTradeAccount && visualRegister !== "PHYSICAL_TRADE")) {
      physicalProps = abstractDataProps();
    } else {
      physicalProps = physicalTradeProps();
    }
  }

  const kickerRaw = (visualCard.subtitle || strategyData.narrative_thread || "").trim();
  const kicker = kickerRaw.replace(/^./, (c) => c.toUpperCase());
  const kickerSentence = kicker ? kicker.split(/(?<=[.!?])\s/)[0] : "";
  // Cut at the last word boundary before the limit, never mid-word, and add
  // an ellipsis only when text was actually removed.
  const KICKER_MAX = 90;
  const kickerLine = kickerSentence.length <= KICKER_MAX
    ? kickerSentence
    : kickerSentence.slice(0, KICKER_MAX).replace(/\s+\S*$/, "").trim() + "…";

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

  return { image_prompt: minimalistStudioPrompt, card_headline: cardHeadline };
}

/**
 * Fallback when the cover is refused or returns nothing (usually Qwen's
 * content-safety filter). Deliberately generic and text-free so it is very
 * unlikely to be refused itself; sent with prompt_extend off.
 */
export const SAFE_COVER_PROMPT = [
  "Create a premium 16:9 editorial still-life photograph for a business publication.",
  "Use a deep graphite desk, a clean unmarked paper document, a matte metal paperweight, and a red pen.",
  "Use restrained teal and coral accent lighting, crisp softbox shadows, realistic materials, generous negative space, and no text.",
  "Do not include people, logos, brand names, interfaces, legal claims, headlines, badges, watermarks, or readable writing.",
].join(" ");

export function renderSafeCover(): { image_prompt: string } {
  return { image_prompt: SAFE_COVER_PROMPT };
}
