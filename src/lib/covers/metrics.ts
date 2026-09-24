/**
 * Exact text widths from the bundled TrueType fonts, so cover text is sized
 * and broken in code before Satori draws it (Satori cannot shrink text to
 * fit). Reads only what a width needs: head (units per em), hhea and hmtx
 * (advance widths), and a format 4 cmap (character to glyph). Kerning is
 * ignored; it moves a line by well under one percent.
 */

export interface FontMetrics {
  unitsPerEm: number;
  /** Advance width in font units for a character; 0 when the font lacks it. */
  advance(codePoint: number): number;
}

export function readMetrics(data: Buffer): FontMetrics {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tables = new Map<string, number>();
  const numTables = view.getUint16(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(view.getUint8(rec), view.getUint8(rec + 1), view.getUint8(rec + 2), view.getUint8(rec + 3));
    tables.set(tag, view.getUint32(rec + 8));
  }
  const table = (tag: string) => {
    const at = tables.get(tag);
    if (at === undefined) throw new Error(`Font has no ${tag} table.`);
    return at;
  };

  const unitsPerEm = view.getUint16(table("head") + 18);
  const numberOfHMetrics = view.getUint16(table("hhea") + 34);
  const hmtx = table("hmtx");
  const advanceOfGlyph = (glyph: number) => view.getUint16(hmtx + 4 * Math.min(glyph, numberOfHMetrics - 1));

  // The Unicode BMP subtable (platform 3 encoding 1, or platform 0), format 4.
  const cmap = table("cmap");
  let sub = -1;
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const rec = cmap + 4 + i * 8;
    const platform = view.getUint16(rec);
    const encoding = view.getUint16(rec + 2);
    const at = cmap + view.getUint32(rec + 4);
    if (view.getUint16(at) === 4 && ((platform === 3 && encoding === 1) || platform === 0)) sub = at;
  }
  if (sub < 0) throw new Error("Font has no format 4 Unicode cmap.");
  const segX2 = view.getUint16(sub + 6);
  const ends = sub + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const offsets = deltas + segX2;

  const glyphOf = (cp: number): number => {
    for (let s = 0; s < segX2; s += 2) {
      if (cp > view.getUint16(ends + s)) continue;
      const start = view.getUint16(starts + s);
      if (cp < start) return 0;
      const delta = view.getInt16(deltas + s);
      const range = view.getUint16(offsets + s);
      if (range === 0) return (cp + delta) & 0xffff;
      const g = view.getUint16(offsets + s + range + 2 * (cp - start));
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };

  const cache = new Map<number, number>();
  return {
    unitsPerEm,
    advance(cp) {
      let w = cache.get(cp);
      if (w === undefined) {
        const g = glyphOf(cp);
        w = g ? advanceOfGlyph(g) : 0;
        cache.set(cp, w);
      }
      return w;
    },
  };
}

/** Width in pixels of text set at size, with letterSpacing (px) after every character. */
export function textWidth(m: FontMetrics, text: string, size: number, letterSpacing = 0): number {
  let units = 0;
  let chars = 0;
  for (const ch of text) {
    // A missing glyph falls back in Satori; half an em is a safe stand-in.
    units += m.advance(ch.codePointAt(0)!) || m.unitsPerEm / 2;
    chars++;
  }
  return (units / m.unitsPerEm) * size + letterSpacing * chars;
}
