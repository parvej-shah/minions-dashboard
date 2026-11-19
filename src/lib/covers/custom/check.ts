import satori from "satori";
import { coverBrand, contrast, DEFAULT_COVER_BRAND } from "../brand";
import { satoriFonts } from "../fonts";
import { COVER_SIZE, CoverFitError, type CoverBrand } from "../layouts";
import { COVER_THEMES, themeColours } from "../themes";
import { SAMPLE_POSTS, type ColourVar } from "./contract";
import { templateElement, type TemplateValues } from "./element";
import { parseTemplate, type TNode, type Template } from "./parse";
import { pictureProblems, pictureSlots, STAND_IN } from "./pictures";
import { themeColourProblems } from "./themeColours";

/**
 * "Is my template good?": the gate every pasted design passes before it is
 * saved (nothing is stored on a failure). It runs the contract parser, then
 * draws the design with three sample posts on the workspace's colours and on
 * two other themes, and reports every problem in plain words. All-or-nothing:
 * no score, no partial save.
 */

export interface Preview {
  name: "short" | "long" | "bare";
  /** The Satori SVG: text is drawn as shapes. Show it as an <img>, never inline in the page. */
  svg: string;
}
/** standIns: the picture slots the design uses that were drawn with a neutral figure because the workspace has none yet. */
export type CheckResult = { ok: true; template: Template; previews: Preview[]; standIns: ("photo" | "cutout")[] } | { ok: false; errors: string[] };

/** The workspace's own headshot and cut-out as data URLs, read only when the design uses them. */
export type PictureLoader = () => Promise<{ photo?: string; cutout?: string }>;

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const TEXT_CONTRAST = 4.5;

function toHex(h: string): string {
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
}

/** A colour value as a hex, reading var(--x) from the brand; null when it is not a plain solid colour. */
function solid(value: unknown, brand: CoverBrand): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  const m = /^var\(--(ink|paper|accent|secondary)\)$/.exec(v);
  if (m) return brand[m[1] as ColourVar];
  return HEX.test(v) ? toHex(v) : null;
}

/** Walks the tree with the inherited text colour and the nearest solid background behind each fitted text. */
function contrastProblems(node: TNode, brand: CoverBrand, colour: string | null, bg: string | null, out: string[]) {
  const own = node.style.color !== undefined ? solid(node.style.color, brand) : colour;
  let behind = bg;
  const ownBg = node.style.backgroundColor ?? node.style.background;
  if (ownBg !== undefined) behind = solid(ownBg, brand);
  // A gradient or picture behind the text: we cannot name one colour, so it is not judged.
  if (node.style.backgroundImage !== undefined) behind = null;
  if (node.fit && own && behind) {
    const c = contrast(own, behind);
    if (c < TEXT_CONTRAST) out.push(`The ${node.fit.slot.replace("_", " ")} (${own}) on ${behind} reads at ${c.toFixed(1)}:1; it needs at least ${TEXT_CONTRAST}:1.`);
  }
  for (const c of node.children) if ("tag" in c) contrastProblems(c, brand, own, behind, out);
}

const DRAW = { ...COVER_SIZE };

async function draw(template: Template, values: TemplateValues, brand: CoverBrand): Promise<string> {
  return satori(templateElement(template, values, brand) as never, { ...DRAW, fonts: satoriFonts(true) as never });
}

export async function checkTemplate(
  source: unknown,
  workspace?: { ink?: string | null; paper?: string | null; accent?: string | null; secondary?: string | null },
  loadPictures?: PictureLoader,
): Promise<CheckResult> {
  const parsed = parseTemplate(source);
  if (!parsed.ok) return parsed;
  const { template } = parsed;
  const rules = [...themeColourProblems(template.root), ...pictureProblems(template.root)];
  if (rules.length) return { ok: false, errors: rules };

  // The previews show the workspace's own photo and cut-out; a neutral figure stands in for any it lacks.
  const used = pictureSlots(template.slots);
  const own = used.length && loadPictures ? await loadPictures().catch(() => ({})) : {};
  const pics = Object.fromEntries(used.map((s) => [s, own[s as keyof typeof own] ?? STAND_IN[s]]));
  const standIns = used.filter((s) => !own[s as keyof typeof own]);
  const withPictures = (values: TemplateValues): TemplateValues => ({ ...values, ...pics });

  const mine = workspace ? coverBrand(workspace).brand : DEFAULT_COVER_BRAND;
  const brands = [mine, ...COVER_THEMES.filter((t) => t.id === "graphite" || t.id === "ivory").map((t) => {
    const c = themeColours(t);
    return coverBrand({ ink: c.primary_ink, paper: c.brand_cream, accent: c.brand_coral, secondary: c.brand_teal }).brand;
  })];

  const errors: string[] = [];
  for (const b of brands) contrastProblems(template.root, b, null, null, errors);
  if (errors.length) return { ok: false, errors: [...new Set(errors)] };

  const samples: { name: Preview["name"]; values: TemplateValues }[] = [
    { name: "short", values: withPictures(SAMPLE_POSTS.short) },
    { name: "long", values: withPictures(SAMPLE_POSTS.long) },
    { name: "bare", values: { ...SAMPLE_POSTS.bare } },
  ];
  const previews: Preview[] = [];
  for (const s of samples) {
    try {
      previews.push({ name: s.name, svg: await draw(template, s.values, mine) });
    } catch (e) {
      const msg = e instanceof CoverFitError ? e.message : "The design could not be drawn.";
      const which = s.name === "long" ? "the longest post" : s.name === "short" ? "a short post" : "a post with no optional lines";
      errors.push(`With ${which}: ${msg}`);
    }
  }
  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  // The other themes must draw too: a design that only works on one palette is refused.
  for (const b of brands.slice(1)) {
    try {
      await draw(template, withPictures(SAMPLE_POSTS.long), b);
    } catch {
      return { ok: false, errors: ["The design could not be drawn on the other colour themes."] };
    }
  }
  return { ok: true, template, previews, standIns };
}
