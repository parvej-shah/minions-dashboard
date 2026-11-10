/**
 * Ten social poster designs (tasks/33.md), made to stand out in an Instagram
 * and Facebook feed: image-led, big type, little text. They come from the
 * 2026-11-10 Pinterest research (highlighter bars, Swiss editorial, sideways
 * giant word, echo stack, colour block with a cursor, split, magazine cover,
 * bento tiles, glowing neon) and the reference pin with a selected word and
 * tilted tags on glowing grid paper (TAGGED).
 *
 * Same rules as modern.tsx: brand colours and our three fonts, every size set
 * by fit.ts, copy that cannot fit rejected, never cut. Nothing is invented:
 * tags are the post's own points, and no design shows counts or figures.
 */
import type { CSSProperties } from "react";
import { faceStyle, metricsFor, type Face } from "./fonts";
import { fit, type Fitted } from "./fit";
import { textWidth } from "./metrics";
import { mix } from "./backgrounds";
import { INNER, PAD, rgba } from "./layouts";
import { Byline, fitBox, giantWord, markedWords, onColour, svg, type BannerSpec } from "./modern";
import type { SocialDesign } from "./bannerTypes";

export { SOCIAL_DESIGNS, type SocialDesign } from "./bannerTypes";

type SocialSpec = BannerSpec & { design: SocialDesign };

const W = 1080;
const H = 1350;
const TAG_MAX = 24;

/** Up to three tags for TAGGED: the post's grid labels, else its list items, each short enough for a sticker. */
export function tagsFor(grid?: { label: string }[] | null, list?: string[] | null): string[] {
  const short = (t: string) => t.trim().length > 0 && t.trim().length <= TAG_MAX;
  const fromGrid = (grid ?? []).map((g) => g.label.trim()).filter(short);
  const source = fromGrid.length ? fromGrid : (list ?? []).map((l) => l.trim()).filter(short);
  return source.slice(0, 3);
}

/**
 * Lines as fit.ts broke them, word by word, with a style for the marked
 * (emphasis) words and an alignment. Widths never change, so the fit holds.
 */
function Words({ fitted, face, lineHeight, color, tracking = 0, align = "flex-start", emphasis, marked: markStyle }: {
  fitted: Fitted; face: Face; lineHeight: number; color: string; tracking?: number; align?: "flex-start" | "center";
  emphasis?: string; marked?: CSSProperties;
}) {
  const { size, lines } = fitted;
  const spacing = tracking * size;
  const space = textWidth(metricsFor(face), " ", size, spacing);
  const marks = markedWords(lines, emphasis);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, ...faceStyle(face), fontSize: size, lineHeight, letterSpacing: spacing, color }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", flexShrink: 0, justifyContent: align }}>
          {line.split(" ").map((w, j, all) => (
            <div key={j} style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", marginRight: j < all.length - 1 ? space : 0, ...(marks.has(`${i}:${j}`) ? markStyle : {}) }}>{w}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

const Label = ({ text, color, size = 26 }: { text?: string; color: string; size?: number }) =>
  text ? <div style={{ display: "flex", ...faceStyle("sansSemi"), fontSize: size, letterSpacing: 0.14 * size, color }}>{text.toUpperCase()}</div> : null;

function Img({ src, w, h, style }: { src: string; w: number; h: number; style?: CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={w} height={h} style={{ position: "absolute", ...style }} alt="" />;
}

// A function, not a constant: layouts.tsx imports this module, so PAD is not set yet at load.
const pageStyle = (): CSSProperties => ({ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: PAD, position: "relative", overflow: "hidden" });

/** An eight-spoke asterisk, the mark the research saw on most premium posts. */
const asterisk = (size: number, color: string) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${[0, 45, 90, 135].map((a) => `<rect x="44" y="4" width="12" height="92" rx="6" fill="${color}" transform="rotate(${a} 50 50)"/>`).join("")}</svg>`);

/** HIGHLIGHT: every headline line on its own bar of brand colour, stepped, on a dark ground. */
function Highlight(spec: SocialSpec) {
  const { brand } = spec;
  const ground = mix(brand.ink, "#000000", 0.25);
  const bar = brand.accentOnInk;
  const onBar = onColour(brand, bar);
  const headline = fitBox(spec.headline, 66, 116, { face: "serif", maxWidth: INNER - 120, maxLines: 4, maxHeight: 640, lineHeight: 1.18, tracking: -0.02 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 30, 36, { face: "sans", maxWidth: INNER - 80, maxLines: 2 }) : null;
  return (
    <div style={{ ...pageStyle(), background: ground }}>
      <Img src={asterisk(300, rgba(bar, 0.9))} w={300} h={300} style={{ right: -70, top: -70 }} />
      <Label text={spec.label} color={rgba(brand.paper, 0.7)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {headline.lines.map((line, i) => (
          <div key={i} style={{ display: "flex", alignSelf: "flex-start", marginLeft: i % 2 ? 56 : 0, marginBottom: 14, padding: `${Math.round(headline.size * 0.04)}px 24px ${Math.round(headline.size * 0.1)}px`, background: bar, transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }}>
            <Words fitted={{ size: headline.size, lines: [line] }} face="serif" tracking={-0.02} lineHeight={1.08} color={onBar} />
          </div>
        ))}
        {kicker ? <div style={{ display: "flex", marginTop: 44 }}><Words fitted={kicker} face="sans" lineHeight={1.35} color={rgba(brand.paper, 0.72)} /></div> : null}
      </div>
      <Byline author={spec.author} brand={brand} color={brand.paper} muted={rgba(brand.paper, 0.62)} ring={bar} />
    </div>
  );
}

/** SWISS: an editorial grid. A rule and meta row on top, one big colour circle, the headline set large at the foot. */
function Swiss(spec: SocialSpec) {
  const { brand } = spec;
  const headline = fitBox(spec.headline, 76, 140, { face: "serif", maxWidth: INNER, maxLines: 4, maxHeight: 600, lineHeight: 0.98, tracking: -0.045 }, "headline");
  const kicker = spec.kicker ? fit(spec.kicker, 26, 30, { face: "sans", maxWidth: 500, maxLines: 3 }) : null;
  const name = fitBox(spec.author.name, 26, 30, { face: "sansBold", maxWidth: 360, maxLines: 1 }, "name");
  const role = spec.author.role ? fit(spec.author.role, 22, 26, { face: "sans", maxWidth: 360, maxLines: 2 }) : null;
  const rule = { display: "flex", height: 3, background: brand.ink } as const;
  return (
    <div style={{ ...pageStyle(), background: brand.paper }}>
      <div style={{ position: "absolute", right: -110, top: 120, width: 540, height: 540, borderRadius: 270, background: brand.accent, display: "flex" }} />
      <div style={{ position: "absolute", left: PAD, top: 380, width: 64, height: 64, background: brand.ink, display: "flex" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18 }}>
        <Label text={spec.label ?? "Notes"} color={brand.ink} size={24} />
        <div style={{ display: "flex", ...faceStyle("sansBold"), fontSize: 24, letterSpacing: 0.14 * 24, color: brand.ink }}>{"(01)"}</div>
      </div>
      <div style={rule} />
      <div style={{ flex: 1, display: "flex" }} />
      <Words fitted={headline} face="serif" tracking={-0.045} lineHeight={0.98} color={brand.ink} emphasis={spec.emphasis} marked={{ color: brand.accent }} />
      <div style={{ ...rule, marginTop: 44 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Words fitted={name} face="sansBold" lineHeight={1.25} color={brand.ink} />
          {role ? <Words fitted={role} face="sans" lineHeight={1.3} color={rgba(brand.ink, 0.62)} /> : null}
        </div>
        {kicker ? <Words fitted={kicker} face="sans" lineHeight={1.35} color={rgba(brand.ink, 0.72)} /> : null}
      </div>
    </div>
  );
}

/** SIDEWAYS: the key word giant and turned up the right edge, the headline in the column beside it, on a dark ground. */
function Sideways(spec: SocialSpec) {
  const { brand } = spec;
  const accent = brand.accentOnInk;
  const word = giantWord(spec.headline, spec.emphasis);
  const giant = fitBox(word, 150, 300, { face: "serif", maxWidth: H - 160, maxLines: 1, tracking: -0.04 }, "giant word");
  const len = textWidth(metricsFor("serif"), word, giant.size, -0.04 * giant.size);
  const column = W - PAD - giant.size * 0.82 - 40;
  const headline = fitBox(spec.headline, 52, 92, { face: "serif", maxWidth: column, maxLines: 5, maxHeight: 640, lineHeight: 1.04, tracking: -0.02 }, "headline");
  const cx = W - giant.size * 0.42;
  const cy = H / 2;
  return (
    <div style={{ ...pageStyle(), background: brand.ink }}>
      <div style={{ position: "absolute", left: Math.round(cx - len / 2), top: Math.round(cy - giant.size / 2), width: Math.ceil(len) + 4, height: giant.size, display: "flex", transform: "rotate(-90deg)", ...faceStyle("serif"), fontSize: giant.size, lineHeight: 1, letterSpacing: -0.04 * giant.size, color: accent, whiteSpace: "nowrap" }}>{word}</div>
      <Label text={spec.label} color={rgba(brand.paper, 0.65)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", width: column }}>
        <div style={{ display: "flex", width: 120, height: 10, background: accent, marginBottom: 48 }} />
        <Words fitted={headline} face="serif" tracking={-0.02} lineHeight={1.04} color={brand.paper} />
      </div>
      <Byline author={spec.author} brand={brand} color={brand.paper} muted={rgba(brand.paper, 0.62)} ring={accent} />
    </div>
  );
}

/** ECHO: the key word stacked four times, the first three in fading outline, the last solid; the headline under it. */
function Echo(spec: SocialSpec) {
  const { brand } = spec;
  const accent = brand.accentOnInk;
  const word = giantWord(spec.headline, spec.emphasis);
  const giant = fitBox(word, 110, 230, { face: "serif", maxWidth: INNER, maxLines: 1, tracking: -0.04 }, "giant word");
  const headline = fitBox(spec.headline, 48, 72, { face: "sansBold", maxWidth: INNER, maxLines: 3, maxHeight: 280, lineHeight: 1.12, tracking: -0.02 }, "headline");
  const ground = mix(brand.ink, "#000000", 0.2);
  // Satori draws no text stroke, so the outline is eight thin shadows around a word in the ground's colour.
  const outline = (c: string) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([x, y]) => `${x * 3}px ${y * 3}px 0 ${c}`).join(", ");
  const row = (o: number, solid: boolean, k: number) => (
    <div key={k} style={{ display: "flex", ...faceStyle("serif"), fontSize: giant.size, lineHeight: 0.9, letterSpacing: -0.04 * giant.size, whiteSpace: "nowrap", color: solid ? accent : ground, ...(solid ? {} : { textShadow: outline(rgba(accent, o)) }) }}>{word}</div>
  );
  return (
    <div style={{ ...pageStyle(), background: ground }}>
      <Label text={spec.label} color={rgba(brand.paper, 0.65)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 48 }}>
        {[0.3, 0.55, 0.8].map((o, k) => row(o, false, k))}
        {row(1, true, 3)}
        <div style={{ display: "flex", marginTop: 56 }}>
          <Words fitted={headline} face="sansBold" tracking={-0.02} lineHeight={1.12} color={brand.paper} />
        </div>
      </div>
      <Byline author={spec.author} brand={brand} color={brand.paper} muted={rgba(brand.paper, 0.62)} />
    </div>
  );
}

/** BOLD: full-bleed brand colour, a huge headline and one big cursor pointing at it. */
function Bold(spec: SocialSpec) {
  const { brand } = spec;
  const field = brand.accent;
  const text = onColour(brand, field);
  const other = text === brand.ink ? brand.paper : brand.ink;
  const headline = fitBox(spec.headline, 84, 160, { face: "serif", maxWidth: INNER, maxLines: 4, maxHeight: 700, lineHeight: 0.98, tracking: -0.04 }, "headline");
  const cursor = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="300" viewBox="0 0 44 52"><path d="M4 4 L4 42 L15 31 L23 48 L31 44 L23 28 L39 28 Z" fill="${other}" stroke="${text}" stroke-width="2.4" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ ...pageStyle(), background: field }}>
      <Img src={cursor} w={260} h={300} style={{ right: 70, bottom: 150, transform: "rotate(-8deg)" }} />
      {spec.label ? (
        <div style={{ display: "flex", alignSelf: "flex-start", padding: "12px 28px", borderRadius: 40, border: `3px solid ${text}` }}>
          <Label text={spec.label} color={text} size={24} />
        </div>
      ) : null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 120 }}>
        <Words fitted={headline} face="serif" tracking={-0.04} lineHeight={0.98} color={text} emphasis={spec.emphasis} marked={{ ...faceStyle("italic"), letterSpacing: 0 }} />
      </div>
      <Byline author={spec.author} brand={brand} color={text} muted={rgba(text, 0.75)} ring={text} />
    </div>
  );
}

/** SPLIT: a dark top with the key word giant in italic, a slanted edge, the headline on paper below. */
function Split(spec: SocialSpec) {
  const { brand } = spec;
  const accent = brand.accentOnInk;
  const word = giantWord(spec.headline, spec.emphasis);
  const giant = fitBox(word, 150, 300, { face: "italic", maxWidth: INNER, maxLines: 1 }, "giant word");
  const headline = fitBox(spec.headline, 60, 104, { face: "serif", maxWidth: INNER, maxLines: 4, maxHeight: 420, lineHeight: 1.02, tracking: -0.03 }, "headline");
  const ground = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${brand.paper}"/><polygon points="0,0 ${W},0 ${W},520 0,610" fill="${brand.ink}"/><polygon points="0,610 ${W},520 ${W},536 0,626" fill="${accent}"/></svg>`);
  return (
    <div style={pageStyle()}>
      <Img src={ground} w={W} h={H} style={{ left: 0, top: 0 }} />
      <Label text={spec.label} color={rgba(brand.paper, 0.7)} />
      <div style={{ display: "flex", height: 400, alignItems: "center" }}>
        <Words fitted={giant} face="italic" lineHeight={1} color={accent} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 80 }}>
        <Words fitted={headline} face="serif" tracking={-0.03} lineHeight={1.02} color={brand.ink} emphasis={spec.emphasis} marked={{ color: brand.accent }} />
      </div>
      <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
    </div>
  );
}

/** A barcode, from a fixed pattern, so a redraw looks the same. */
const barcode = (color: string) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="170" height="90">${[3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2].reduce((acc, w, i) => ({ x: acc.x + w * 2 + 2, s: acc.s + (i % 2 ? "" : `<rect x="${acc.x}" y="0" width="${w * 2}" height="90" fill="${color}"/>`) }), { x: 0, s: "" }).s}</svg>`);

/** MAGAZINE: a magazine cover. Your name as the masthead, your cut-out in front of it when you have one, the headline as the cover line. */
function Magazine(spec: SocialSpec) {
  const { brand } = spec;
  const accent = brand.accentOnInk;
  const ink = brand.paper;
  const mast = fitBox(spec.author.name.toUpperCase(), 110, 230, { face: "serif", maxWidth: W - 120, maxLines: 1, tracking: -0.05 }, "masthead");
  const headline = fitBox(spec.headline, 58, 96, { face: "serif", maxWidth: INNER, maxLines: 3, maxHeight: 300, lineHeight: 1.0, tracking: -0.03 }, "headline");
  const top = 70;
  let person = null;
  if (spec.cutout) {
    const scale = Math.min(1000 / spec.cutout.height, 900 / spec.cutout.width);
    const cw = Math.round(spec.cutout.width * scale);
    const ch = Math.round(spec.cutout.height * scale);
    person = <Img src={spec.cutout.src} w={cw} h={ch} style={{ left: Math.round((W - cw) / 2), top: H - ch }} />;
  }
  const word = giantWord(spec.headline, spec.emphasis);
  const art = spec.cutout ? null : fitBox(word, 150, 330, { face: "italic", maxWidth: W - 60, maxLines: 1 }, "cover word");
  return (
    <div style={{ ...pageStyle(), background: mix(brand.ink, "#000000", 0.15), padding: 0 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", backgroundImage: `radial-gradient(circle at 50% 55%, ${rgba(accent, 0.35)}, ${rgba(accent, 0)} 60%)` }} />
      <div style={{ position: "absolute", left: 0, top: top, width: W, display: "flex", justifyContent: "center" }}>
        <Words fitted={mast} face="serif" tracking={-0.05} lineHeight={1} color={accent} />
      </div>
      {art ? (
        <div style={{ position: "absolute", left: 0, top: 520, width: W, display: "flex", justifyContent: "center" }}>
          <Words fitted={art} face="italic" lineHeight={1} color={rgba(ink, 0.92)} />
        </div>
      ) : null}
      {person}
      <div style={{ position: "absolute", left: 60, top: top + mast.size + 12, width: W - 120, display: "flex", justifyContent: "space-between", borderTop: `2px solid ${rgba(ink, 0.5)}`, paddingTop: 12 }}>
        <Label text={spec.label ?? "Field notes"} color={rgba(ink, 0.85)} size={22} />
        <Label text={spec.author.role ?? "Issue 01"} color={rgba(ink, 0.85)} size={22} />
      </div>
      <div style={{ position: "absolute", left: 0, top: H - 520, width: W, height: 520, display: "flex", backgroundImage: `linear-gradient(to bottom, ${rgba(brand.ink, 0)}, ${rgba(brand.ink, 0.92)} 55%)` }} />
      <div style={{ position: "absolute", left: 60, bottom: 70, width: W - 120, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: INNER - 120 }}>
          <Words fitted={headline} face="serif" tracking={-0.03} lineHeight={1.0} color={ink} emphasis={spec.emphasis} marked={{ color: accent }} />
        </div>
        <Img src={barcode(ink)} w={170} h={90} style={{ position: "relative" }} />
      </div>
    </div>
  );
}

/** BENTO: the headline in a grid of rounded tiles: the headline tile, a colour tile with an asterisk, the key word, the author. */
function Bento(spec: SocialSpec) {
  const { brand } = spec;
  const G = 20;
  const P = 56;
  const inner = W - P * 2;
  const half = (inner - G) / 2;
  const accent = brand.accentOnInk;
  const headline = fitBox(spec.headline, 58, 100, { face: "serif", maxWidth: inner - 112, maxLines: 4, maxHeight: 440, lineHeight: 1.02, tracking: -0.03 }, "headline");
  const word = giantWord(spec.headline, spec.emphasis);
  const giant = fitBox(word, 70, 140, { face: "italic", maxWidth: half - 80, maxLines: 1 }, "key word");
  const tile = (bg: string, extra: CSSProperties = {}): CSSProperties => ({ display: "flex", borderRadius: 40, background: bg, position: "relative", overflow: "hidden", ...extra });
  const arrow = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><circle cx="44" cy="44" r="44" fill="${brand.paper}"/><path d="M30 58 L58 30 M36 30 H58 V52" stroke="${brand.ink}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: P, background: mix(brand.paper, brand.ink, 0.06) }}>
      <div style={{ ...tile(brand.ink, { flexDirection: "column", justifyContent: "space-between", padding: 56, height: 660 }) }}>
        <Label text={spec.label ?? " "} color={rgba(brand.paper, 0.6)} size={22} />
        <Words fitted={headline} face="serif" tracking={-0.03} lineHeight={1.02} color={brand.paper} emphasis={spec.emphasis} marked={{ color: accent }} />
      </div>
      <div style={{ display: "flex", marginTop: G, height: 280 }}>
        <div style={{ ...tile(brand.accent, { width: half, alignItems: "center", justifyContent: "center" }) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asterisk(170, onColour(brand, brand.accent))} width={170} height={170} alt="" />
        </div>
        <div style={{ ...tile(mix(brand.paper, "#ffffff", 0.6), { width: half, marginLeft: G, alignItems: "center", justifyContent: "center" }) }}>
          <Words fitted={giant} face="italic" lineHeight={1} color={brand.accent} />
        </div>
      </div>
      <div style={{ ...tile(brand.secondary, { flex: 1, marginTop: G, padding: "0 48px", alignItems: "center", justifyContent: "space-between" }) }}>
        <Byline author={spec.author} brand={brand} color={onColour(brand, brand.secondary)} muted={rgba(onColour(brand, brand.secondary), 0.7)} ring={onColour(brand, brand.secondary)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={arrow} width={88} height={88} alt="" />
      </div>
    </div>
  );
}

/** A small target doodle, as on the reference pin's tags. */
const target = (color: string) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="3"/><circle cx="20" cy="20" r="7" fill="${color}"/></svg>`);

/** TAGGED: glowing grid paper; the key word selected with marker triangles and set bold and slanted; the post's own points as tilted tags. */
function Tagged(spec: SocialSpec) {
  const { brand } = spec;
  const accent = brand.accent;
  const onAccent = onColour(brand, accent);
  const LH = 1.14;
  const headline = fitBox(spec.headline, 72, 118, { face: "sans", maxWidth: INNER - 60, maxLines: 4, maxHeight: 560, lineHeight: LH, tracking: -0.03 }, "headline");
  const heading = spec.label ? fitBox(`${spec.label}:`, 40, 52, { face: "sansBold", maxWidth: INNER, maxLines: 1, tracking: -0.02 }, "label") : null;
  const size = headline.size;
  const lh = size * LH;
  const grid = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <pattern id="g" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0 H0 V54" fill="none" stroke="${brand.ink}" stroke-opacity="0.07" stroke-width="1.5"/></pattern>
    <radialGradient id="a" cx="1" cy="0" r="0.55"><stop offset="0" stop-color="${accent}" stop-opacity="0.85"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="0" cy="1" r="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.7"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="${mix(brand.paper, "#ffffff", 0.5)}"/><rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#a)"/><rect width="${W}" height="${H}" fill="url(#b)"/></svg>`);
  const tri = (up: boolean) => svg(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="30" viewBox="0 0 34 30"><polygon points="${up ? "17,0 34,30 0,30" : "0,0 34,0 17,30"}" fill="${accent}"/></svg>`);

  // Where every word sits, so the marker triangles and the tags land in real gaps, never on a word.
  const reg = metricsFor("sans");
  const bold = metricsFor("sansBold");
  const spacing = -0.03 * size;
  const space = textWidth(reg, " ", size, spacing);
  const marks = markedWords(headline.lines, spec.emphasis);
  const box = { pad: 10, gap: Math.round(size * 0.2) };
  let mark: { x: number; y: number; w: number } | null = null;
  const lineEnds = headline.lines.map((line, i) => {
    let x = 0;
    line.split(" ").forEach((w, j) => {
      const marked = marks.has(`${i}:${j}`);
      const ww = marked ? textWidth(bold, w, size, spacing) + box.pad * 2 - 13 : textWidth(reg, w, size, spacing);
      if (marked && !mark) mark = { x: x - 13, y: i * lh, w: ww + 13 };
      x += ww + (marked ? box.gap : space);
    });
    return x;
  });
  const tagW = (t: string) => textWidth(metricsFor("sansSemi"), t, 30, 0) + 48 + 48;
  const room = INNER + PAD - 24;
  const placed: { t: string; left: number; top: number; angle: number }[] = [];
  const below: string[] = [];
  const free = lineEnds.map((end, i) => ({ i, end })).sort((p, q) => p.end - q.end);
  (spec.tags ?? []).slice(0, 3).forEach((t, k) => {
    const spot = free.find((f) => f.end + 28 + tagW(t) <= room);
    if (!spot) return void below.push(t);
    free.splice(free.indexOf(spot), 1);
    placed.push({ t, left: Math.round(spot.end + 28), top: Math.round(spot.i * lh + size * 0.28), angle: k % 2 ? 5 : -5 });
  });
  const Tag = ({ t, angle }: { t: string; angle: number }) => (
    <div style={{ display: "flex", alignItems: "center", transform: `rotate(${angle}deg)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={target(accent)} width={40} height={40} style={{ marginRight: 8 }} alt="" />
      <div style={{ display: "flex", padding: "10px 24px", borderRadius: 30, background: accent, color: onAccent, ...faceStyle("sansSemi"), fontSize: 30, whiteSpace: "nowrap", boxShadow: `0 6px 14px ${rgba(brand.ink, 0.18)}` }}>{t}</div>
    </div>
  );
  const m = mark as { x: number; y: number; w: number } | null;
  return (
    <div style={pageStyle()}>
      <Img src={grid} w={W} h={H} style={{ left: 0, top: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {heading ? <div style={{ display: "flex", marginBottom: 64 }}><Words fitted={heading} face="sansBold" tracking={-0.02} lineHeight={1.1} color={brand.ink} /></div> : null}
        <div style={{ display: "flex", position: "relative" }}>
          <Words
            fitted={headline}
            face="sans"
            tracking={-0.03}
            lineHeight={LH}
            color={brand.ink}
            emphasis={spec.emphasis}
            marked={{ ...faceStyle("sansBold"), letterSpacing: spacing, transform: "skewX(-10deg)", background: rgba(accent, 0.2), border: `3px solid ${accent}`, padding: `0 ${box.pad}px`, marginLeft: -13, marginRight: box.gap }}
          />
          {m ? <Img src={tri(false)} w={34} h={30} style={{ left: m.x - 26, top: m.y - 14 }} /> : null}
          {m ? <Img src={tri(true)} w={34} h={30} style={{ left: m.x + m.w - 30, top: m.y + lh - 10 }} /> : null}
          {placed.map((p) => (
            <div key={p.t} style={{ position: "absolute", left: p.left, top: p.top, display: "flex" }}><Tag t={p.t} angle={p.angle} /></div>
          ))}
        </div>
        {below.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 48 }}>
            {below.map((t, k) => <div key={t} style={{ display: "flex", marginRight: 24, marginBottom: 16 }}><Tag t={t} angle={k % 2 ? 4 : -4} /></div>)}
          </div>
        ) : null}
      </div>
      <Byline author={spec.author} brand={brand} color={brand.ink} muted={rgba(brand.ink, 0.62)} />
    </div>
  );
}

/** NEON: a glowing frame and a glowing key word on a near-black ground, the headline centred. */
function Neon(spec: SocialSpec) {
  const { brand } = spec;
  const glow = brand.accentOnInk;
  const headline = fitBox(spec.headline, 66, 112, { face: "sansBold", maxWidth: INNER - 60, maxLines: 4, maxHeight: 600, lineHeight: 1.08, tracking: -0.03 }, "headline");
  const label = spec.label ? fit(spec.label.toUpperCase(), 22, 26, { face: "sansSemi", maxWidth: INNER - 100, maxLines: 1 }) : null;
  return (
    <div style={{ ...pageStyle(), background: mix(brand.ink, "#000000", 0.55), alignItems: "center" }}>
      <div style={{ position: "absolute", left: 44, top: 44, width: W - 88, height: H - 88, borderRadius: 48, border: `4px solid ${glow}`, boxShadow: `0 0 28px ${rgba(glow, 0.8)}, inset 0 0 28px ${rgba(glow, 0.45)}`, display: "flex" }} />
      {label ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: glow, boxShadow: `0 0 16px ${glow}`, marginRight: 16, display: "flex" }} />
          <Words fitted={label} face="sansSemi" tracking={0.14} lineHeight={1} color={glow} />
        </div>
      ) : null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Words fitted={headline} face="sansBold" tracking={-0.03} lineHeight={1.08} color={brand.paper} align="center" emphasis={spec.emphasis} marked={{ color: glow, textShadow: `0 0 18px ${rgba(glow, 0.9)}, 0 0 42px ${rgba(glow, 0.6)}` }} />
      </div>
      <div style={{ display: "flex", alignSelf: "flex-start", paddingLeft: 20, marginBottom: 10 }}>
        <Byline author={spec.author} brand={brand} color={brand.paper} muted={rgba(brand.paper, 0.6)} ring={glow} />
      </div>
    </div>
  );
}

/** The social design as a Satori element. Throws CoverFitError when its copy cannot fit. */
export function socialElement(spec: SocialSpec) {
  switch (spec.design) {
    case "HIGHLIGHT": return Highlight(spec);
    case "SWISS": return Swiss(spec);
    case "SIDEWAYS": return Sideways(spec);
    case "ECHO": return Echo(spec);
    case "BOLD": return Bold(spec);
    case "SPLIT": return Split(spec);
    case "MAGAZINE": return Magazine(spec);
    case "BENTO": return Bento(spec);
    case "TAGGED": return Tagged(spec);
    case "NEON": return Neon(spec);
  }
}
