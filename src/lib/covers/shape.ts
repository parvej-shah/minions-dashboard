/**
 * What a post holds that a poster can show, as the model read it
 * (src/lib/prompts/posterShape.ts), after code has checked every part
 * against the post. A part that fails a check is dropped, never repaired, so
 * a poster only shows what the post says. Stored on the cover card as
 * `shape`, read once per draft.
 */
import { ICONS, type IconName } from "./icons";
import { newFigures } from "./copy";

export interface PosterShape {
  list?: { title: string; items: string[] };
  grid?: { title: string; items: { label: string; icon: IconName }[] };
  punch?: { lines: string[]; checks: string[] };
  own_story: boolean;
}

export const SHAPE_LIMITS = {
  list: { items: [3, 4], words: [2, 6], chars: 42 },
  grid: { items: [3, 6], words: [1, 3], chars: 22 },
  punch: { lines: [3, 4], lineWords: [1, 5], lineChars: 30, checks: [3, 4], checkWords: [2, 5], checkChars: 34 },
  title: { words: [3, 7], chars: 48 },
} as const;

const clean = (t: unknown) => (typeof t === "string" ? t.replace(/\s+/g, " ").replace(/[—–]/g, ", ").trim() : "");
const wordCount = (t: string) => t.split(" ").filter(Boolean).length;
const within = (n: number, [lo, hi]: readonly [number, number]) => n >= lo && n <= hi;
const sentence = (t: string) => t.replace(/^\p{Ll}/u, (c) => c.toUpperCase());
/** Text a poster can't carry: a label colon, a link, a hashtag. */
const BAD = /[:#]|https?:|\p{Extended_Pictographic}/u;

/** Why a phrase can't go on a poster, or null when it can. */
function phraseProblem(t: string, words: readonly [number, number], chars: number, body: string): string | null {
  if (!t) return "empty";
  if (!within(wordCount(t), words)) return `"${t}" is ${wordCount(t)} words, not ${words.join("-")}`;
  if (t.length > chars) return `"${t}" is over ${chars} characters`;
  if (BAD.test(t)) return `"${t}" has a colon, link, hashtag or emoji`;
  const figures = newFigures(t, body);
  if (figures.length) return `"${t}" states ${figures.join(", ")}, which the post does not`;
  return null;
}

/** Each distinct phrase once, case aside: a repeated item reads as filler. */
const distinct = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase())).size === xs.length;

/**
 * Reads the model's answer into a shape, keeping only the parts that pass.
 * `notes` says why a part was dropped, for the cover's review notes.
 */
export function parseShape(raw: unknown, body: string, notes: string[] = []): PosterShape {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const shape: PosterShape = { own_story: r.own_story === true };
  const L = SHAPE_LIMITS;
  const titleOk = (t: string, part: string) => {
    const why = phraseProblem(t, L.title.words, L.title.chars, body);
    if (why) notes.push(`No ${part} poster: title ${why}.`);
    return !why;
  };

  const list = r.list as { title?: unknown; items?: unknown } | null;
  if (list && typeof list === "object") {
    const title = sentence(clean(list.title).replace(/[.]+$/, ""));
    const items = (Array.isArray(list.items) ? list.items : []).map((x) => sentence(clean(x).replace(/[.]+$/, "")));
    const why = !within(items.length, L.list.items) ? `${items.length} items, not ${L.list.items.join("-")}` : !distinct(items) ? "repeated items" : items.map((i) => phraseProblem(i, L.list.words, L.list.chars, body)).find(Boolean);
    if (why) notes.push(`No list poster: ${why}.`);
    else if (titleOk(title, "list")) shape.list = { title, items };
  }

  const grid = r.grid as { title?: unknown; items?: unknown } | null;
  if (grid && typeof grid === "object") {
    const title = sentence(clean(grid.title).replace(/[.]+$/, ""));
    const raw = (Array.isArray(grid.items) ? grid.items : []) as { label?: unknown; icon?: unknown }[];
    const items = raw.map((x) => ({ label: sentence(clean(x?.label).replace(/[.]+$/, "")), icon: clean(x?.icon).toUpperCase() }));
    const unknownIcon = items.find((i) => !(i.icon in ICONS));
    const icons = items.map((i) => i.icon);
    const why = !within(items.length, L.grid.items)
      ? `${items.length} items, not ${L.grid.items.join("-")}`
      : unknownIcon
        ? `no icon named ${unknownIcon.icon || "(none)"}`
        : !distinct(icons) || !distinct(items.map((i) => i.label))
          ? "a repeated icon or label"
          : items.map((i) => phraseProblem(i.label, L.grid.words, L.grid.chars, body)).find(Boolean);
    if (why) notes.push(`No grid poster: ${why}.`);
    else if (titleOk(title, "grid")) shape.grid = { title, items: items as { label: string; icon: IconName }[] };
  }

  const punch = r.punch as { lines?: unknown; checks?: unknown } | null;
  if (punch && typeof punch === "object") {
    const lines = (Array.isArray(punch.lines) ? punch.lines : []).map((x) => sentence(clean(x).replace(/[.!]*$/, ".")));
    const checks = (Array.isArray(punch.checks) ? punch.checks : []).map((x) => sentence(clean(x).replace(/[.]+$/, "")));
    const why = !within(lines.length, L.punch.lines)
      ? `${lines.length} lines, not ${L.punch.lines.join("-")}`
      : !within(checks.length, L.punch.checks)
        ? `${checks.length} checks, not ${L.punch.checks.join("-")}`
        : !distinct(lines) || !distinct(checks)
          ? "repeated lines"
          : lines.map((l) => phraseProblem(l, L.punch.lineWords, L.punch.lineChars, body)).find(Boolean) ?? checks.map((c) => phraseProblem(c, L.punch.checkWords, L.punch.checkChars, body)).find(Boolean);
    if (why) notes.push(`No punch poster: ${why}.`);
    else shape.punch = { lines, checks };
  }
  return shape;
}

/** A reviewer's change to a poster's items: each list replaces the whole part. */
export interface ShapeEdit {
  list?: string[];
  /** The grid's labels in order; each keeps its icon, so the count can't change. */
  grid_labels?: string[];
  punch?: { lines: string[]; checks: string[] };
}

/**
 * The shape with a reviewer's items in place, held to the same checks as the
 * model's (length, no colon or link, no figure the post lacks), or why not.
 */
export function editShape(shape: PosterShape, edit: ShapeEdit, body: string): { shape: PosterShape } | { error: string } {
  const notes: string[] = [];
  if (edit.list) {
    const parsed = parseShape({ list: { title: shape.list?.title ?? "What the post covers", items: edit.list } }, body, notes);
    if (!parsed.list) return { error: notes[0]?.replace(/^No list poster: /, "List: ") ?? "The list can't go on the cover." };
    shape = { ...shape, list: parsed.list };
  }
  if (edit.grid_labels) {
    if (!shape.grid) return { error: "This post has no grid to edit." };
    if (edit.grid_labels.length !== shape.grid.items.length) return { error: `The grid has ${shape.grid.items.length} tiles; give one label for each.` };
    const items = shape.grid.items.map((it, i) => ({ label: edit.grid_labels![i], icon: it.icon }));
    const parsed = parseShape({ grid: { title: shape.grid.title, items } }, body, notes);
    if (!parsed.grid) return { error: notes[0]?.replace(/^No grid poster: /, "Grid: ") ?? "The grid can't go on the cover." };
    shape = { ...shape, grid: parsed.grid };
  }
  if (edit.punch) {
    const parsed = parseShape({ punch: edit.punch }, body, notes);
    if (!parsed.punch) return { error: notes[0]?.replace(/^No punch poster: /, "Punch: ") ?? "The lines can't go on the cover." };
    shape = { ...shape, punch: parsed.punch };
  }
  return { shape };
}

/** The JSON object in a chat-completions reply body, or null. */
export function shapeJson(raw: string): unknown {
  let text = raw;
  try {
    text = String(JSON.parse(raw)?.choices?.[0]?.message?.content ?? raw);
  } catch {
    // not an API envelope: read it as the content itself
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}
