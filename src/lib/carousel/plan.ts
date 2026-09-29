/**
 * The carousel slide plan and its gates (phase 11, D19). One model call
 * writes the plan; everything here is decided in code: which layouts exist,
 * how many words each may hold, where a figure or a quote may come from, and
 * whether every slide fits. A plan that fails comes back with the reasons,
 * which the caller sends to the model once before giving up.
 */
import { bannedHits } from "@/lib/drafts/banned";
import { numbersIn, unsupportedNumbers } from "@/lib/harvest/text";
import { CoverFitError, coverElement, type CoverSpec } from "@/lib/covers/layouts";
import { ICONS, type IconName } from "./icons";
import { DEFAULT_SLIDE_STYLE, SLIDE_LAYOUTS, SLIDE_STYLES, slideElement, type Deck, type Slide, type SlideLayout, type SlideStyle } from "./slides";

export const CAROUSEL_STRUCTURES = ["CHECKLIST", "STEPS", "DECISION", "CONTRAST", "TEARDOWN"] as const;
export type CarouselStructure = (typeof CAROUSEL_STRUCTURES)[number];

/** Slides after the cover: with it, a deck is 5 to 10 pages. */
export const INNER_SLIDES = { min: 4, max: 9 } as const;
export const CAPTION_WORDS = { min: 30, max: 90 } as const;
export const COVER_HEADLINE_WORDS = { min: 5, max: 11 } as const;

/** The most words each field may hold. The prompt states these same numbers. */
export const WORD_CAPS: Record<SlideLayout, Record<string, number>> = {
  STAKES: { statement: 18, body: 22 },
  POINT: { title: 12, body: 22 },
  STEP: { title: 12, body: 22 },
  CONTRAST: { before: 14, after: 18, beforeLabel: 3, afterLabel: 3 },
  CHECKLIST: { title: 8, item: 9 },
  NUMBER: { caption: 14 },
  QUOTE: { quote: 28, attribution: 6 },
  CLOSE: { takeaway: 14, saveLine: 10 },
};

export interface CarouselPlan {
  structure: CarouselStructure;
  /** The frame's design, picked to suit the post. */
  style: SlideStyle;
  /** The small label on every inner slide, 2 to 4 words. */
  label: string;
  cover: { headline: string; emphasis?: string; kicker?: string };
  slides: Slide[];
  /** The post text above the document: short, pointing into it. */
  caption: string;
  /** LinkedIn shows it on the document. */
  documentTitle: string;
}

export interface PlanSources {
  /** The draft body, hook and core argument: what the carousel may say. */
  texts: string[];
  /** The author's own experience, word for word: the only source of a QUOTE. */
  memory: string[];
  banned: string[];
  /**
   * Claims the draft check could not verify (opinion, unsourced). The post
   * can hedge them in context; a slide strips the context, so a slide or
   * caption may not repeat one with its figure as if it were fact.
   */
  unverified?: string[];
}

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", fifteen: "15", twenty: "20", thirty: "30", forty: "40", fifty: "50", hundred: "100", thousand: "1000",
  half: "0.5", double: "2x", twice: "2x", triple: "3x",
};
const QUANTITY_PHRASE = new RegExp(`\\b(\\d+(?:[.,]\\d+)?|${Object.keys(NUMBER_WORDS).join("|")})\\s*(%|percent\\b|[a-z]+)`, "gi");

/** "two seconds" and "2 seconds" alike, as "2 second": a figure with its unit, however it is spelled. */
export function quantities(text: string): string[] {
  const out = new Set<string>();
  for (const [, n, unit] of text.matchAll(QUANTITY_PHRASE)) {
    const value = NUMBER_WORDS[n.toLowerCase()] ?? n.replace(",", ".");
    const u = unit.toLowerCase() === "percent" ? "%" : unit.toLowerCase().replace(/s$/, "");
    out.add(`${value} ${u}`);
  }
  return [...out];
}

/** The unverified claim a line restates with its figure: the same figure and unit, or most of the same words and any figure. */
export function restatedUnverified(line: string, unverified: string[]): string | undefined {
  const mine = quantities(line);
  if (!mine.length) return undefined;
  return unverified.find((claim) => {
    const theirs = quantities(claim);
    return theirs.some((q) => mine.includes(q)) || (theirs.length > 0 && overlap(line, claim) >= 0.5);
  });
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown) => s(v) || undefined;
/** An icon is decoration: a name that is not in the set means no icon, not a failed plan. */
const iconOf = (v: unknown): IconName | undefined => {
  const name = s(v).toUpperCase().replace(/[-\s]/g, "_");
  return name in ICONS ? (name as IconName) : undefined;
};
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);

/** Reads the model's JSON (or a stored plan sent back by the review screen) into a plan. Unknown layouts are errors, not dropped slides. */
export function parsePlan(raw: string): { plan: CarouselPlan | null; errors: string[] } {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    return { plan: null, errors: ["The reply was not valid JSON."] };
  }
  const errors: string[] = [];
  const structure = s(json.structure).toUpperCase() as CarouselStructure;
  if (!CAROUSEL_STRUCTURES.includes(structure)) errors.push(`structure must be one of ${CAROUSEL_STRUCTURES.join(", ")}.`);
  // Plans stored before styles have none: they keep the design they were drawn in.
  const style = (s(json.style).toUpperCase() || DEFAULT_SLIDE_STYLE) as SlideStyle;
  if (!SLIDE_STYLES.includes(style)) errors.push(`style must be one of ${SLIDE_STYLES.join(", ")}.`);
  const cover = (json.cover ?? {}) as Record<string, unknown>;
  const slides: Slide[] = [];
  for (const [i, raw] of (Array.isArray(json.slides) ? json.slides : []).entries()) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const layout = s(r.layout).toUpperCase() as SlideLayout;
    if (!SLIDE_LAYOUTS.includes(layout)) {
      errors.push(`Slide ${i + 2}: layout "${s(r.layout)}" does not exist.`);
      continue;
    }
    switch (layout) {
      case "STAKES": slides.push({ layout, statement: s(r.statement), body: opt(r.body), emphasis: opt(r.emphasis), icon: iconOf(r.icon) }); break;
      case "POINT":
      case "STEP": slides.push({ layout, title: s(r.title), body: opt(r.body), emphasis: opt(r.emphasis), icon: iconOf(r.icon) }); break;
      case "CONTRAST": slides.push({ layout, before: s(r.before), after: s(r.after), beforeLabel: opt(r.before_label ?? r.beforeLabel), afterLabel: opt(r.after_label ?? r.afterLabel) }); break;
      case "CHECKLIST": slides.push({ layout, title: s(r.title), items: (Array.isArray(r.items) ? r.items : []).map(s).filter(Boolean) }); break;
      case "NUMBER": slides.push({ layout, value: s(r.value), unit: opt(r.unit), caption: s(r.caption) }); break;
      case "QUOTE": slides.push({ layout, quote: s(r.quote), attribution: opt(r.attribution) }); break;
      case "CLOSE": slides.push({ layout, takeaway: s(r.takeaway), saveLine: opt(r.save_line ?? r.saveLine) }); break;
    }
  }
  // The same drawing twice reads as filler: a repeat is dropped, the first kept.
  const used = new Set<IconName>();
  for (const slide of slides) {
    if (!("icon" in slide) || !slide.icon) continue;
    if (used.has(slide.icon)) slide.icon = undefined;
    else used.add(slide.icon);
  }
  const plan: CarouselPlan = {
    structure,
    style,
    label: s(json.label),
    cover: { headline: s(cover.headline), emphasis: opt(cover.emphasis), kicker: opt(cover.kicker) },
    slides,
    caption: s(json.caption),
    documentTitle: s(json.document_title ?? json.documentTitle),
  };
  return { plan, errors };
}

/** Every piece of text on a slide, by field name. */
function fieldsOf(slide: Slide): [string, string][] {
  const { layout, ...rest } = slide;
  void layout;
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(rest)) {
    if (k === "emphasis" || k === "unit" || k === "value" || k === "icon") continue;
    if (Array.isArray(v)) v.forEach((x) => out.push(["item", String(x)]));
    else if (typeof v === "string" && v) out.push([k, v]);
  }
  return out;
}

/** The main line of a slide: what two slides must not both say. */
function mainLine(slide: Slide): string {
  switch (slide.layout) {
    case "STAKES": return slide.statement;
    case "POINT":
    case "STEP":
    case "CHECKLIST": return slide.title;
    case "CONTRAST": return slide.after;
    case "NUMBER": return slide.caption;
    case "QUOTE": return slide.quote;
    case "CLOSE": return slide.takeaway;
  }
}

function overlap(a: string, b: string): number {
  const x = new Set(norm(a));
  const y = new Set(norm(b));
  if (!x.size || !y.size) return 0;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / Math.min(x.size, y.size);
}

/** The text-only gates: shape, word caps, sources, banned words, repetition. */
export function checkPlan(plan: CarouselPlan, sources: PlanSources): string[] {
  const errors: string[] = [];
  const n = plan.slides.length;
  if (n < INNER_SLIDES.min || n > INNER_SLIDES.max) errors.push(`Write ${INNER_SLIDES.min} to ${INNER_SLIDES.max} slides after the cover, not ${n}.`);
  if (plan.slides[n - 1]?.layout !== "CLOSE") errors.push("The last slide must be CLOSE.");
  if (plan.slides.filter((x) => x.layout === "CLOSE").length > 1) errors.push("Only one CLOSE slide.");
  for (const layout of ["NUMBER", "QUOTE"] as const) {
    if (plan.slides.filter((x) => x.layout === layout).length > 1) errors.push(`At most one ${layout} slide.`);
  }
  const steps = plan.slides.filter((x) => x.layout === "STEP").length;
  if (steps === 1) errors.push("A single STEP is not a sequence: use POINT, or write 2 to 5 steps.");
  if (steps > 5) errors.push("At most 5 STEP slides.");

  if (!plan.label || words(plan.label) > 4) errors.push("label must be 1 to 4 words.");
  const hw = words(plan.cover.headline);
  if (hw < COVER_HEADLINE_WORDS.min || hw > COVER_HEADLINE_WORDS.max) errors.push(`The cover headline must be ${COVER_HEADLINE_WORDS.min} to ${COVER_HEADLINE_WORDS.max} words, not ${hw}.`);
  if (plan.cover.kicker && words(plan.cover.kicker) > 16) errors.push("The cover kicker must be 16 words or fewer.");
  const cw = words(plan.caption);
  if (cw < CAPTION_WORDS.min || cw > CAPTION_WORDS.max) errors.push(`The caption must be ${CAPTION_WORDS.min} to ${CAPTION_WORDS.max} words, not ${cw}.`);
  if (!plan.documentTitle) errors.push("document_title is missing.");

  plan.slides.forEach((slide, i) => {
    const at = `Slide ${i + 2} (${slide.layout})`;
    for (const [field, text] of fieldsOf(slide)) {
      const cap = WORD_CAPS[slide.layout][field];
      if (cap && words(text) > cap) errors.push(`${at}: ${field} has ${words(text)} words; the most is ${cap}.`);
    }
    if (!mainLine(slide)) errors.push(`${at}: the main text is empty.`);
    if (slide.layout === "CHECKLIST" && (slide.items.length < 2 || slide.items.length > 5)) errors.push(`${at}: 2 to 5 items, not ${slide.items.length}.`);
    if (slide.layout === "NUMBER") {
      const known = numbersIn(sources.texts.join(" "));
      const stated = numbersIn(slide.value);
      if (!stated.length || !stated.every((x) => known.includes(x))) errors.push(`${at}: the figure "${slide.value}" is not stated in the draft. Use no NUMBER slide.`);
    }
    if (slide.layout === "QUOTE" && !sources.memory.some((m) => overlap(slide.quote, m) >= 0.8)) {
      errors.push(`${at}: a QUOTE must be the author's own words from THE AUTHOR'S EXPERIENCE. Use no QUOTE slide.`);
    }
  });

  // Every figure anywhere must come from the draft.
  const all = [plan.label, plan.documentTitle, plan.cover.headline, plan.cover.kicker ?? "", plan.caption, ...plan.slides.flatMap((x) => fieldsOf(x).map(([, t]) => t))].join("\n");
  const invented = unsupportedNumbers(all, [...sources.texts, ...sources.memory]);
  if (invented.length) errors.push(`States figures the draft does not: ${invented.join(", ")}. Remove them.`);
  // Line by line, so one sentence is judged against one claim.
  for (const line of all.split(/\n|(?<=[.!?])\s+/).map((l) => l.trim()).filter(Boolean)) {
    const claim = restatedUnverified(line, sources.unverified ?? []);
    if (claim) errors.push(`"${line}" states an unverified claim with its figure as fact ("${claim.slice(0, 90)}"). Drop the figure, or leave the claim out.`);
  }
  const banned = bannedHits(all, sources.banned);
  if (banned.length) errors.push(`Uses banned phrases: ${banned.join(", ")}.`);
  if (/[—–]|--/.test(all)) errors.push("No em or en dashes. Use periods, commas or colons.");
  // Markdown, not hashtags: "#VoiceAI" is fine, "## Heading", "*bold*" and backticks are not.
  if (/(^|\s)(#{1,6}\s|\*|`)/.test(all)) errors.push("No markdown.");
  if (/\bcomment\b[^.]*\b(below|["“'][^"”']+["”'])/i.test(plan.caption)) errors.push("No engagement bait in the caption.");

  // No two slides saying the same thing.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlap(mainLine(plan.slides[i]), mainLine(plan.slides[j])) >= 0.75) errors.push(`Slides ${i + 2} and ${j + 2} make the same point.`);
    }
  }
  return errors;
}

/** Builds the deck, and checks that every page fits. */
export function toDeck(plan: CarouselPlan, base: { author: CoverSpec["author"]; brand: CoverSpec["brand"]; art?: CoverSpec["art"] }): { deck: Deck; errors: string[] } {
  const cover: CoverSpec = { layout: "HEADLINE", headline: plan.cover.headline, emphasis: plan.cover.emphasis, kicker: plan.cover.kicker, author: base.author, brand: base.brand, art: base.art };
  const deck: Deck = { cover, slides: plan.slides, label: plan.label, author: base.author, brand: base.brand, style: plan.style };
  const errors: string[] = [];
  try {
    coverElement(cover);
  } catch (e) {
    // The illustration is dropped before the copy is blamed, as covers do.
    if (e instanceof CoverFitError && cover.art) {
      deck.cover = { ...cover, art: undefined };
      try {
        coverElement(deck.cover);
      } catch (e2) {
        errors.push(`Cover: ${(e2 as Error).message}`);
      }
    } else errors.push(`Cover: ${(e as Error).message}`);
  }
  for (let i = 1; i <= plan.slides.length; i++) {
    try {
      slideElement(deck, i);
    } catch (e) {
      if (e instanceof CoverFitError) errors.push(`Slide ${i + 1} (${plan.slides[i - 1].layout}): ${e.message} Shorten it.`);
      else errors.push(`Slide ${i + 1}: ${(e as Error).message}`);
    }
  }
  return { deck, errors };
}


/**
 * Whether a draft has the shape a carousel needs: enough substance, and
 * points that stand on their own (sections, a list, or several paragraphs).
 * A suggestion only (D19): the reviewer decides.
 */
export function suggestCarousel(body: string): { yes: boolean; reason: string } {
  const text = body.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  const count = words(text);
  const sections = (text.match(/^#{2,3}\s/gm) ?? []).length;
  const items = (text.match(/^\s*(?:[-*]|\d+[.)])\s/gm) ?? []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => words(p) >= 12 && !/^#/.test(p.trim())).length;
  if (count < 150) return { yes: false, reason: "Too short to carry 5 or more slides; a normal post fits it better." };
  if (items >= 3) return { yes: true, reason: `It has a ${items}-item list, which reads well as slides.` };
  if (sections >= 2) return { yes: true, reason: `It has ${sections} sections, each of which can become a slide.` };
  if (paragraphs >= 5) return { yes: true, reason: `It makes ${paragraphs} separate points.` };
  return { yes: false, reason: "It makes one continuous argument; a normal post fits it better." };
}
