import { metricsFor, type Face } from "./fonts";
import { textWidth } from "./metrics";

/**
 * Text fitting for editorial covers (phase 5 of
 * docs/product/authority-flywheel-plan.md). Satori lays text out but cannot
 * shrink it, so code picks the size and the line breaks from the fonts' real
 * advance widths; the layouts then draw exactly these lines. Copy that cannot
 * fit is rejected, never cut.
 */

export interface TextBox {
  face: Face;
  maxWidth: number;
  maxLines: number;
  /** Letter spacing as a share of the size (negative tightens). */
  tracking?: number;
  /** With lineHeight: the most vertical space the lines may take. */
  maxHeight?: number;
  lineHeight?: number;
}

/** Greedy word wrap. A single word wider than the box gets its own line (fit rejects it). */
export function wrap(text: string, size: number, box: TextBox): string[] {
  const m = metricsFor(box.face);
  const spacing = (box.tracking ?? 0) * size;
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (!line || textWidth(m, next, size, spacing) <= box.maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface Fitted {
  size: number;
  lines: string[];
}

/** The largest size in [min, max] (step 2) whose lines fit the box's width, line count and height, or null. */
export function fit(text: string, min: number, max: number, box: TextBox): Fitted | null {
  const m = metricsFor(box.face);
  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(text, size, box);
    const spacing = (box.tracking ?? 0) * size;
    const tallEnough = box.maxHeight === undefined || lines.length * size * (box.lineHeight ?? 1.2) <= box.maxHeight;
    if (lines.length <= box.maxLines && tallEnough && lines.every((l) => textWidth(m, l, size, spacing) <= box.maxWidth)) return { size, lines };
  }
  return null;
}

/**
 * The lines evened out so the last one is not a lone word ("...your calendar
 * never / sees"): first at the same size with the width narrowed a step at a
 * time, then up to three sizes smaller (about 10%) at full width. Unchanged
 * when neither helps.
 */
export function balance(f: Fitted, box: TextBox): Fitted {
  const lonely = (lines: string[]) => lines.length > 1 && !lines[lines.length - 1].includes(" ");
  if (!lonely(f.lines)) return f;
  const text = f.lines.join(" ");
  for (let w = box.maxWidth - 16; w >= box.maxWidth * 0.6; w -= 16) {
    const lines = wrap(text, f.size, { ...box, maxWidth: w });
    if (lines.length !== f.lines.length) break;
    if (!lonely(lines)) return { size: f.size, lines };
  }
  for (let size = f.size - 2; size >= f.size - 6; size -= 2) {
    const smaller = fit(text, size, size, box);
    if (smaller && !lonely(smaller.lines)) return smaller;
  }
  return f;
}
