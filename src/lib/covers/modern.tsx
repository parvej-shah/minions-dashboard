/**
 * The modern banner types from the 2026-11-09 Pinterest research
 * (docs/research/carousel-design-2026-11-09.md, tasks/9.md and 10.md). Each
 * adds one hand-made touch to plain type: a torn strip that reveals the
 * punchline, a design-tool selection box, sticker tags, a notebook sheet, a
 * notes card, a post card, a hand-circled word, the author's cut-out in
 * front of a giant word. They are cover layouts (layouts.tsx draws them
 * through bannerElement).
 *
 * Same rules as layouts.tsx: brand colours, every size and line break set by
 * fit.ts, copy that cannot fit rejected, never cut. No invented figures: the
 * post card shows no like or view counts.
 */
import type { ReactNode } from "react";
import { faceStyle, metricsFor, type Face } from "./fonts";
import { balance, fit, type Fitted, type TextBox } from "./fit";
import { textWidth } from "./metrics";
import { contrast } from "./brand";
import { backgroundSrc, blockColour, mix } from "./backgrounds";
import { CoverFitError, INNER, Lines, PAD, initials, rgba, type CoverAuthor, type CoverBrand } from "./layouts";

import { isSocial, type BannerDesign } from "./bannerTypes";
import { socialElement } from "./social";

export { BANNER_DESIGNS, type BannerDesign } from "./bannerTypes";

export interface BannerSpec {
  design: BannerDesign;
  headline: string;
  /** One word (or a short phrase) of the headline that gets the design's mark. */
  emphasis?: string;
  /** The line under the headline; TORN reveals it on the strip. */
  kicker?: string;
  /** Who it is for. */
  label?: string;
  /** The post's number in the author's series, for designs that show one. */
  seriesNo?: number;
  /** CUTOUT: the author's photo with a transparent background, trimmed to the person. */
  cutout?: { src: string; width: number; height: number };
  /** TAGGED: up to three short tags, taken from the post's own points (social.tsx tagsFor). */
  tags?: string[];
  author: CoverAuthor;
  brand: CoverBrand;
}

// The cover size (layouts.tsx COVER_SIZE), literal: layouts.tsx imports this module.
const W = 1080;
const H = 1350;
export const svg = (s: string) => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
export const wordKey = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
export const onColour = (b: CoverBrand, bg: string) => (contrast(b.ink, bg) >= contrast(b.paper, bg) ? b.ink : b.paper);

export function fitBox(text: string, min: number, max: number, box: TextBox, what: string): Fitted {
  const f = fit(text, min, max, box);
  if (!f) throw new CoverFitError(`The ${what} is too long for this banner: "${text.slice(0, 80)}"`);
  return balance(f, box);
}

/** The words that carry the mark: the emphasis phrase where one line holds it, else its first word of 3+ letters. */
export function markedWords(lines: string[], emphasis?: string): Set<string> {
  const target = (emphasis ?? "").split(/\s+/).map(wordKey).filter(Boolean);
  const out = new Set<string>();
  if (!target.length) return out;
  lines.forEach((line, i) => {
    const ws = line.split(" ");
    for (let a = 0; a + target.length <= ws.length; a++) {
      if (target.every((t, k) => wordKey(ws[a + k]) === t)) target.forEach((_, k) => out.add(`${i}:${a + k}`));
    }
  });
  if (!out.size) {
    lines.forEach((line, i) => line.split(" ").forEach((w, j) => {
      if (!out.size && wordKey(w).length >= 3 && target.includes(wordKey(w))) out.add(`${i}:${j}`);
    }));
  }
  return out;
}

/**
 * Lines as fit.ts broke them, with a decoration drawn around the marked run
 * of each line: the decoration gets the run's measured width and height, and
 * sits absolutely, so it never moves a word.
 */
function DecoLines({ fitted, face, tracking = 0, lineHeight, color, emphasis, markColor, deco }: {
  fitted: Fitted; face: Face; tracking?: number; lineHeight: number; color: string; emphasis?: string; markColor?: string;
  deco: (width: number, height: number) => ReactNode;
}) {
  const { size, lines } = fitted;
  const spacing = tracking * size;
  const m = metricsFor(face);
  const space = textWidth(m, " ", size, spacing);
  const marked = markedWords(lines, emphasis);
  return (
    <div style={{ display: "flex", flexDirection: "column", ...faceStyle(face), fontSize: size, lineHeight, letterSpacing: spacing, color }}>
      {lines.map((line, i) => {
        const ws = line.split(" ");
        const runStart = ws.findIndex((_, j) => marked.has(`${i}:${j}`));
        let runEnd = runStart;
        while (runStart >= 0 && runEnd + 1 < ws.length && marked.has(`${i}:${runEnd + 1}`)) runEnd++;
        const before = runStart > 0 ? ws.slice(0, runStart) : runStart === 0 ? [] : ws;
        const run = runStart >= 0 ? ws.slice(runStart, runEnd + 1).join(" ") : "";
        const after = runStart >= 0 ? ws.slice(runEnd + 1) : [];
        const word = (w: string, k: string | number) => <div key={k} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", marginRight: space }}>{w}</div>;
        const runWidth = run ? textWidth(m, run, size, spacing) : 0;
        return (
          <div key={i} style={{ display: "flex", flexShrink: 0 }}>
            {before.map((w, j) => word(w, `b${j}`))}
            {run ? (
              <div style={{ display: "flex", position: "relative", flexShrink: 0, whiteSpace: "nowrap", marginRight: space, color: markColor ?? color }}>
                {deco(runWidth, size * lineHeight)}
                <div style={{ display: "flex" }}>{run}</div>
              </div>
            ) : null}
            {after.map((w, j) => word(w, `a${j}`))}
          </div>
        );
      })}
    </div>
  );
}

const AVATAR = 96;

export function Byline({ author, brand, color, muted, ring }: { author: CoverAuthor; brand: CoverBrand; color: string; muted: string; ring?: string }) {
  const name = fitBox(author.name, 34, 40, { face: "sansSemi", maxWidth: INNER - AVATAR - 28, maxLines: 1 }, "name");
  const role = author.role ? fit(author.role, 26, 30, { face: "sans", maxWidth: INNER - AVATAR - 28, maxLines: 1 }) : null;
  const border = ring ? { border: `4px solid ${ring}` } : {};
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {author.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.photo} width={AVATAR} height={AVATAR} style={{ borderRadius: AVATAR / 2, objectFit: "cover", ...border }} alt="" />
      ) : (
        <div style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, background: brand.secondary, color: brand.paper, display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 36, ...border }}>{initials(author.name)}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 24 }}>
        <Lines fitted={name} face="sansSemi" lineHeight={1.2} color={color} />
        {role ? <Lines fitted={role} face="sans" lineHeight={1.3} color={muted} /> : null}
      </div>
    </div>
  );
}

/** TORN: the headline on a deep accent field; a torn paper strip across it reveals the kicker, the punchline. */
function Torn(spec: BannerSpec) {
  const { brand } = spec;
  if (!spec.kicker) throw new CoverFitError("A torn banner needs a kicker to reveal.");
  const field = blockColour(brand);
  const text = onColour(brand, field);
  const headline = fitBox(spec.headline, 72, 132, { face: "serif", maxWidth: INNER, maxLines: 4, maxHeight: 560, lineHeight: 1.02 }, "headline");
  const kicker = fitBox(spec.kicker, 48, 68, { face: "italic", maxWidth: INNER - 40, maxLines: 3 }, "kicker");
  const stripHeight = kicker.lines.length * kicker.size * 1.2 + 150;
  // A jagged edge, top and bottom, from a fixed pattern so a redraw looks the same.
  const teeth = (y: number, dir: number) => Array.from({ length: 41 }, (_, i) => `${i * 30},${y + dir * (i % 3 === 0 ? 14 : i % 2 ? 4 : 22)}`).join(" ");
  const paper = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${stripHeight}" viewBox="0 0 1200 ${stripHeight}">
    <polygon points="0,30 ${teeth(30, -1)} 1200,30 1200,${stripHeight - 30} ${teeth(stripHeight - 30, 1).split(" ").reverse().join(" ")} 0,${stripHeight - 30}" fill="${mix(brand.ink, field, 0.6)}" transform="translate(10,14)"/>
    <polygon points="0,30 ${teeth(30, -1)} 1200,30 1200,${stripHeight - 30} ${teeth(stripHeight - 30, 1).split(" ").reverse().join(" ")} 0,${stripHeight - 30}" fill="${mix(brand.paper, "#ffffff", 0.4)}"/></svg>`);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: field, padding: PAD, position: "relative" }}>
      {spec.label ? <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 28, letterSpacing: 0.12 * 28, color: rgba(text, 0.75), marginBottom: 40 }}>{spec.label.toUpperCase()}</div> : null}
      <Lines fitted={headline} face="serif" lineHeight={1.02} color={text} />
      <div style={{ display: "flex", position: "relative", width: 1200, height: stripHeight, marginLeft: -PAD - 60, marginTop: 56, transform: "rotate(-2.5deg)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={paper} width={1200} height={stripHeight} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        <div style={{ display: "flex", position: "absolute", left: PAD + 60 + 20, top: 75 }}>
          <Lines fitted={kicker} face="italic" lineHeight={1.2} color={brand.ink} />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex" }} />
      <Byline author={spec.author} brand={brand} color={text} muted={rgba(text, 0.75)} ring={text} />
    </div>
  );
}

/** SELECT: the emphasis word in a design tool's selection box, with corner handles and the author's cursor beside it, on dot paper. */
function Select(spec: BannerSpec) {
  const { brand } = spec;
  // Narrower than the page: the box, its handles and the cursor beside it stay inside the margin.
  const headline = fitBox(spec.headline, 72, 128, { face: "serif", maxWidth: INNER - 150, maxLines: 4, maxHeight: 620, lineHeight: 1.08 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 34, 42, { face: "sans", maxWidth: INNER, maxLines: 3 }) : null;
  const dots = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><pattern id="d" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="2.2" fill="${brand.ink}" fill-opacity="0.16"/></pattern></defs><rect width="${W}" height="${H}" fill="${brand.paper}"/><rect width="${W}" height="${H}" fill="url(#d)"/></svg>`);
  const first = spec.author.name.split(/\s+/)[0] ?? spec.author.name;
  const handle = (x: number, y: number) => <div style={{ position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, background: brand.paper, border: `3px solid ${brand.accent}`, display: "flex" }} />;
  const cursor = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52"><path d="M4 4 L4 42 L15 31 L23 48 L31 44 L23 28 L39 28 Z" fill="${brand.secondary}" stroke="${brand.paper}" stroke-width="3" stroke-linejoin="round"/></svg>`);
  const deco = (w: number, h: number) => {
    const pad = 14;
    const bw = w + pad * 2;
    const bh = h + pad;
    return (
      <div style={{ position: "absolute", left: -pad, top: -pad / 2, width: bw, height: bh, display: "flex" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: bw, height: bh, border: `3px solid ${brand.accent}`, background: rgba(brand.accent, 0.1), display: "flex" }} />
        {handle(0, 0)}{handle(bw, 0)}{handle(0, bh)}{handle(bw, bh)}
        <div style={{ position: "absolute", left: bw - 6, top: bh + 4, display: "flex", alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cursor} width={44} height={52} alt="" />
          <div style={{ display: "flex", marginTop: 40, marginLeft: -6, padding: "8px 20px", borderRadius: 22, background: brand.secondary, color: onColour(brand, brand.secondary), ...faceStyle("sansSemi"), fontSize: 30, lineHeight: 1.2, letterSpacing: 0 }}>{first}</div>
        </div>
      </div>
    );
  };
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dots} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      {spec.label ? <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 28, letterSpacing: 0.12 * 28, color: rgba(brand.ink, 0.6) }}>{spec.label.toUpperCase()}</div> : null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <DecoLines fitted={headline} face="serif" lineHeight={1.08} color={brand.ink} emphasis={spec.emphasis} deco={deco} />
        {kicker ? <div style={{ display: "flex", marginTop: 96 }}><Lines fitted={kicker} face="sans" lineHeight={1.35} color={rgba(brand.ink, 0.72)} /></div> : null}
      </div>
      <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
    </div>
  );
}

/** A rotated sticker pill. */
function Sticker({ text, bg, fg, angle }: { text: string; bg: string; fg: string; angle: number }) {
  return (
    <div style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", alignSelf: "flex-start", padding: "14px 30px", borderRadius: 40, background: bg, color: fg, ...faceStyle("sansBold"), fontSize: 30, letterSpacing: 0.02 * 30, transform: `rotate(${angle}deg)`, boxShadow: `0 6px 0 ${rgba("#000000", 0.18)}` }}>{text}</div>
  );
}

/** STICKER: the headline with tag stickers slapped on above and below it, on engineering paper. */
function StickerBanner(spec: BannerSpec) {
  const { brand } = spec;
  const headline = fitBox(spec.headline, 72, 136, { face: "serif", maxWidth: INNER, maxLines: 4, maxHeight: 640, lineHeight: 1.04 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 34, 42, { face: "sans", maxWidth: INNER - 120, maxLines: 2 }) : null;
  const label = spec.label ? fitBox(spec.label, 26, 30, { face: "sansBold", maxWidth: INNER - 200, maxLines: 1 }, "label").lines[0] : null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundSrc("GRID", brand)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {label ? <div style={{ display: "flex", marginBottom: 48 }}><Sticker text={label} bg={brand.accent} fg={onColour(brand, brand.accent)} angle={-5} /></div> : null}
        <Lines fitted={headline} face="serif" lineHeight={1.04} color={brand.ink} emphasis={spec.emphasis} accent={brand.accent} emphasisFace="italic" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 56 }}>
          {kicker ? <Lines fitted={kicker} face="sans" lineHeight={1.35} color={rgba(brand.ink, 0.72)} /> : <div style={{ display: "flex" }} />}
          {spec.seriesNo ? <Sticker text={`No. ${String(spec.seriesNo).padStart(2, "0")}`} bg={brand.secondary} fg={onColour(brand, brand.secondary)} angle={6} /> : null}
        </div>
      </div>
      <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
    </div>
  );
}

/** NOTEBOOK: the headline on a ruled notebook sheet laid over two offset coloured sheets, numbered in the author's series. */
function Notebook(spec: BannerSpec) {
  const { brand } = spec;
  const field = blockColour(brand);
  const sheetW = INNER + 20;
  const sheetH = 900;
  const headline = fitBox(spec.headline, 64, 112, { face: "serif", maxWidth: sheetW - 140, maxLines: 4, maxHeight: 470, lineHeight: 1.06 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 32, 38, { face: "sans", maxWidth: sheetW - 140, maxLines: 3 }) : null;
  const ruled = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}"><rect width="${sheetW}" height="${sheetH}" rx="10" fill="${mix(brand.paper, "#ffffff", 0.5)}"/>${Array.from({ length: 16 }, (_, i) => `<line x1="0" x2="${sheetW}" y1="${150 + i * 48}" y2="${150 + i * 48}" stroke="${brand.secondary}" stroke-opacity="0.16" stroke-width="2"/>`).join("")}<line x1="96" x2="96" y1="0" y2="${sheetH}" stroke="${brand.accent}" stroke-opacity="0.5" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${110 + i * 92}" cy="46" r="15" fill="${field}"/>`).join("")}</svg>`);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: field, padding: PAD, position: "relative" }}>
      <div style={{ position: "absolute", left: PAD + 36, top: 150, width: sheetW, height: sheetH, background: brand.secondary, borderRadius: 10, transform: "rotate(5deg)", display: "flex" }} />
      <div style={{ position: "absolute", left: PAD - 10, top: 140, width: sheetW, height: sheetH, background: brand.ink, borderRadius: 10, transform: "rotate(-4deg)", display: "flex" }} />
      <div style={{ position: "absolute", left: PAD - 10, top: 130, width: sheetW, height: sheetH, display: "flex", flexDirection: "column", padding: "130px 60px 50px 130px", transform: "rotate(-1deg)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ruled} width={sheetW} height={sheetH} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        <Lines fitted={headline} face="serif" lineHeight={1.06} color={brand.ink} emphasis={spec.emphasis} accent={brand.accent} emphasisFace="italic" />
        {kicker ? <div style={{ display: "flex", marginTop: 40 }}><Lines fitted={kicker} face="sans" lineHeight={1.4} color={rgba(brand.ink, 0.7)} /></div> : null}
        <div style={{ flex: 1, display: "flex" }} />
        {spec.seriesNo ? <div style={{ display: "flex", alignSelf: "flex-end", ...faceStyle("italic"), fontSize: 52, color: brand.accent }}>{`no. ${String(spec.seriesNo).padStart(2, "0")}`}</div> : null}
      </div>
      <div style={{ flex: 1, display: "flex" }} />
      <Byline author={spec.author} brand={brand} color={onColour(brand, field)} muted={rgba(onColour(brand, field), 0.75)} ring={onColour(brand, field)} />
    </div>
  );
}

/** NOTES: the headline written on a phone notes card, casual and first-person. */
function Notes(spec: BannerSpec) {
  const { brand } = spec;
  const cardW = INNER;
  const headline = fitBox(spec.headline, 60, 104, { face: "sansBold", maxWidth: cardW - 112, maxLines: 4, maxHeight: 480, lineHeight: 1.1, tracking: -0.02 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 34, 40, { face: "sans", maxWidth: cardW - 112, maxLines: 4 }) : null;
  const icon = (d: string) => svg(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="${brand.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  const back = icon("M15 5 L8 12 L15 19");
  const share = icon("M12 3 V15 M7 8 L12 3 L17 8 M5 13 V20 H19 V13");
  const more = icon("M6 12 h.01 M12 12 h.01 M18 12 h.01");
  const bar = [icon("M5 6 h14 M5 12 h14 M5 18 h9"), icon("M4 8 h16 v11 h-16 z M9 8 l1.5 -3 h3 L15 8"), icon("M12 4 l6 6 l-9 9 h-4 v-4 z"), icon("M5 5 h14 v14 h-14 z M8 12 h8 M12 8 v8")];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative", alignItems: "center", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundSrc("MESH", brand)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      <div style={{ display: "flex", flexDirection: "column", width: cardW, padding: "40px 56px 44px", borderRadius: 48, background: mix(brand.paper, "#ffffff", 0.7), boxShadow: `0 30px 60px ${rgba(brand.ink, 0.16)}`, transform: "rotate(-2deg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", color: brand.accent, ...faceStyle("sansSemi"), fontSize: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={back} width={40} height={40} alt="" />
            <div style={{ display: "flex", marginLeft: 6 }}>Notes</div>
          </div>
          <div style={{ display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={share} width={40} height={40} style={{ marginRight: 24 }} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={more} width={40} height={40} alt="" />
          </div>
        </div>
        <Lines fitted={headline} face="sansBold" tracking={-0.02} lineHeight={1.1} color={brand.ink} emphasis={spec.emphasis} accent={brand.accent} emphasisFace="italic" />
        {kicker ? <div style={{ display: "flex", marginTop: 36 }}><Lines fitted={kicker} face="sans" lineHeight={1.45} color={rgba(brand.ink, 0.75)} /></div> : null}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64, paddingTop: 28, borderTop: `2px solid ${rgba(brand.ink, 0.08)}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {bar.map((b, i) => <img key={i} src={b} width={40} height={40} alt="" />)}
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 72, alignSelf: "flex-start" }}>
        <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
      </div>
    </div>
  );
}

/** POSTCARD: the headline as the text of a social post by the author, on a dark glow. No counts: they would be invented. */
function Postcard(spec: BannerSpec) {
  const { brand } = spec;
  const ink = brand.paper;
  const headline = fitBox(spec.headline, 64, 128, { face: "sans", maxWidth: INNER - 40, maxLines: 6, maxHeight: 700, lineHeight: 1.18, tracking: -0.02 }, "headline");
  const icon = (d: string) => svg(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="${rgba(ink, 0.55)}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  const icons = [
    "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
    "M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3",
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
    "M4 12v8h16v-8 M16 6l-4-4-4 4 M12 2v13",
  ].map(icon);
  const name = fitBox(spec.author.name, 38, 44, { face: "sansBold", maxWidth: INNER - 200, maxLines: 1 }, "name");
  const role = spec.author.role ? fit(spec.author.role, 28, 32, { face: "sans", maxWidth: INNER - 200, maxLines: 1 }) : null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD + 8, position: "relative", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundSrc("AURORA", brand)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      <div style={{ display: "flex", alignItems: "center", marginBottom: 72 }}>
        {spec.author.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spec.author.photo} width={120} height={120} style={{ borderRadius: 60, objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: 60, background: brand.accentOnInk, color: onColour(brand, brand.accentOnInk), display: "flex", alignItems: "center", justifyContent: "center", ...faceStyle("sansBold"), fontSize: 44 }}>{initials(spec.author.name)}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 32 }}>
          <Lines fitted={name} face="sansBold" lineHeight={1.2} color={ink} />
          {role ? <Lines fitted={role} face="sans" lineHeight={1.3} color={rgba(ink, 0.6)} /> : null}
        </div>
      </div>
      <Lines fitted={headline} face="sans" tracking={-0.02} lineHeight={1.18} color={ink} emphasis={spec.emphasis} accent={brand.accentOnInk} emphasisFace="italic" />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 96, paddingRight: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {icons.map((s, i) => <img key={i} src={s} width={44} height={44} alt="" />)}
      </div>
    </div>
  );
}

/** CIRCLED: the emphasis word circled by hand in the accent, a doodled arrow down to the kicker. */
function Circled(spec: BannerSpec) {
  const { brand } = spec;
  // Narrower than the page, and loose line spacing, so the loop has room around its word.
  const headline = fitBox(spec.headline, 72, 132, { face: "serif", maxWidth: INNER - 100, maxLines: 4, maxHeight: 700, lineHeight: 1.2 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 44, 60, { face: "italic", maxWidth: INNER - 160, maxLines: 3 }) : null;
  const deco = (w: number, h: number) => {
    const bw = Math.round(w * 1.1 + 60);
    const bh = Math.round(h * 1.5);
    // An open loop that overshoots its start, as a pen would.
    const loop = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}" viewBox="0 0 ${bw} ${bh}"><path d="M${bw * 0.62} ${bh * 0.08} C ${bw * 0.98} ${bh * 0.1}, ${bw * 1.0} ${bh * 0.88}, ${bw * 0.5} ${bh * 0.93} C ${bw * 0.06} ${bh * 0.96}, ${bw * 0.0} ${bh * 0.2}, ${bw * 0.42} ${bh * 0.1} C ${bw * 0.6} ${bh * 0.06}, ${bw * 0.75} ${bh * 0.12}, ${bw * 0.8} ${bh * 0.2}" fill="none" stroke="${brand.accent}" stroke-width="7" stroke-linecap="round"/></svg>`);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={loop} width={bw} height={bh} style={{ position: "absolute", left: -(bw - w) / 2, top: -h * 0.22, width: bw, height: bh, maxWidth: bw }} alt="" />
    );
  };
  const arrow = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M20 10 C 70 20, 90 60, 60 100" fill="none" stroke="${brand.accent}" stroke-width="6" stroke-linecap="round"/><path d="M42 88 L60 102 L74 82" fill="none" stroke="${brand.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundSrc("FOLDED", brand)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      {spec.label ? <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 28, letterSpacing: 0.12 * 28, color: rgba(brand.ink, 0.6) }}>{spec.label.toUpperCase()}</div> : null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <DecoLines fitted={headline} face="serif" lineHeight={1.2} color={brand.ink} emphasis={spec.emphasis} deco={deco} />
        {kicker ? (
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arrow} width={120} height={120} style={{ marginRight: 24 }} alt="" />
            <div style={{ display: "flex", marginTop: 70 }}><Lines fitted={kicker} face="italic" lineHeight={1.2} color={rgba(brand.ink, 0.85)} /></div>
          </div>
        ) : null}
      </div>
      <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
    </div>
  );
}

/** The word set giant behind the author: the emphasis when it is one word, else the headline's longest word. */
export function giantWord(headline: string, emphasis?: string): string {
  const clean = (w: string) => w.replace(/[^\p{L}\p{N}'’-]/gu, "");
  if (emphasis && !/\s/.test(emphasis.trim()) && clean(emphasis)) return clean(emphasis).toLowerCase();
  const words = headline.split(/\s+/).map(clean).filter(Boolean);
  return words.reduce((a, b) => (b.length > a.length ? b : a), "").toLowerCase();
}

/** CUTOUT: the author's cut-out photo standing in front of one giant italic word, the headline above, on a dark glow. */
function Cutout(spec: BannerSpec) {
  const { brand } = spec;
  if (!spec.cutout) throw new CoverFitError("A cut-out banner needs a cut-out photo of the author.");
  const ink = brand.paper;
  const accent = brand.accentOnInk;
  const headline = fitBox(spec.headline, 60, 100, { face: "serif", maxWidth: INNER, maxLines: 3, maxHeight: 330, lineHeight: 1.04 }, "headline");
  const word = giantWord(spec.headline, spec.emphasis);
  const giant = fitBox(word, 150, 420, { face: "italic", maxWidth: W - 60, maxLines: 1 }, "giant word");
  // The person stands on the bottom edge, as tall as the page below the headline allows.
  const maxH = 800;
  const scale = Math.min(maxH / spec.cutout.height, 980 / spec.cutout.width);
  const cw = Math.round(spec.cutout.width * scale);
  const ch = Math.round(spec.cutout.height * scale);
  const name = fitBox(spec.author.name, 30, 36, { face: "sansSemi", maxWidth: 520, maxLines: 1 }, "name");
  const role = spec.author.role ? fit(spec.author.role, 22, 26, { face: "sans", maxWidth: 520, maxLines: 1 }) : null;
  // High enough that the head covers only the word's lower half, so it stays
  // readable above it; never into the headline (the line box has the ascent's air on top).
  const labelRow = spec.label ? 28 * 1.2 + 32 : 0;
  const giantTop = Math.max(340, Math.round(PAD + labelRow + headline.lines.length * headline.size * 1.04 - giant.size * 0.12));
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundSrc("AURORA", brand)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      <div style={{ position: "absolute", left: 0, top: giantTop, width: W, display: "flex", justifyContent: "center" }}>
        <Lines fitted={giant} face="italic" lineHeight={1} color={accent} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={spec.cutout.src} width={cw} height={ch} style={{ position: "absolute", left: Math.round((W - cw) / 2), top: H - ch }} alt="" />
      {spec.label ? <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: 28, letterSpacing: 0.12 * 28, color: rgba(ink, 0.7), marginBottom: 32 }}>{spec.label.toUpperCase()}</div> : null}
      {/* No emphasis in the headline: the giant word already carries it. */}
      <Lines fitted={headline} face="serif" lineHeight={1.04} color={ink} />
      <div style={{ flex: 1, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", padding: "20px 32px", borderRadius: 28, background: rgba(brand.ink, 0.78), border: `2px solid ${rgba(ink, 0.14)}` }}>
        <Lines fitted={name} face="sansSemi" lineHeight={1.2} color={ink} />
        {role ? <Lines fitted={role} face="sans" lineHeight={1.3} color={rgba(ink, 0.7)} /> : null}
      </div>
    </div>
  );
}

/** The banner as a Satori element. Throws CoverFitError when its copy cannot fit. */
export function bannerElement(spec: BannerSpec) {
  if (isSocial(spec.design)) return socialElement({ ...spec, design: spec.design });
  switch (spec.design) {
    case "TORN": return Torn(spec);
    case "SELECT": return Select(spec);
    case "STICKER": return StickerBanner(spec);
    case "NOTEBOOK": return Notebook(spec);
    case "NOTES": return Notes(spec);
    case "POSTCARD": return Postcard(spec);
    case "CIRCLED": return Circled(spec);
    case "CUTOUT": return Cutout(spec);
  }
}
