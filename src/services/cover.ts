import { prisma } from "@/lib/prisma";
import { background } from "@/lib/background";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/r2";
import { coverBrand } from "@/lib/covers/brand";
import { bodyOf, checkCoverLine, pickCoverLine, chooseCoverCopy, coverOptions, coverOutOfDate, scoreHeadline, quoteSource, type CoverCard, type CoverCopy } from "@/lib/covers/copy";
import { askJev } from "@/lib/ai/jev";
import { chatWithFallback } from "@/lib/ai/modelChain";
import { withCostMeter } from "@/lib/ai/cost";
import { parseCoverLines, renderCoverLine, type ProposedCoverLine } from "@/lib/prompts/coverLine";
import { CoverFitError, type CoverLayout, type CoverSpec } from "@/lib/covers/layouts";
import { renderCoverPng } from "@/lib/covers/render";
import { chooseArt, parseArtStyle, DEFAULT_COVER_ART_STYLE, type CoverArtStyle } from "@/lib/covers/art";
import { numbersIn } from "@/lib/harvest/text";
import { FIRST_POST_TAG } from "@/constants/firstPost";
import { renderPosterShape } from "@/lib/prompts/posterShape";
import { editShape, parseShape, shapeJson, type PosterShape, type ShapeEdit } from "@/lib/covers/shape";
import { eligibleTypes, fallbackOrder, pickPosterType } from "@/lib/covers/posterType";
import { dataUrlFitsPoster, prepareCutout } from "@/lib/covers/photo";
import { NEEDS_SHAPE, attempts, editAttempts, posterParts, sameType, switchLayout } from "@/lib/covers/layoutSwitch";

/**
 * Draws an asset's cover in code and attaches it (phase 5 of
 * docs/product/authority-flywheel-plan.md). Called by 02_idea_to_asset once
 * the draft is saved, and by the dashboard when a reviewer edits the cover.
 * No image model is involved, so a cover costs nothing and takes about a
 * second.
 */

const COVER_PROVIDER = "template";

/**
 * What a reviewer may change on a cover: the type, the wording and a
 * poster's items. Everything else comes from the draft and the brand.
 */
export interface CoverEdit extends ShapeEdit {
  layout?: CoverLayout;
  headline?: string;
  kicker?: string;
  emphasis?: string;
  /** The illustration style for this cover only. */
  art?: CoverArtStyle;
  /** A different illustration in the same style. */
  art_reroll?: boolean;
}

/** The stored record: the spec without the embedded photo, plus how the copy was chosen. */
export type StoredCoverSpec = Omit<CoverSpec, "author"> & {
  author: { name: string; role?: string; has_photo: boolean; photo_ok?: boolean; cutout_ok?: boolean };
  card: CoverCard;
  /** The illustration style this cover was drawn with, NONE included, so a re-draw keeps it. */
  art_style: CoverArtStyle;
  /** False when the layout has no room for it (QUOTE, NUMBER) or the headline needed the space. */
  art_drawn: boolean;
  headline_source: CoverCopy["headline_source"] | "reviewer";
  score: CoverCopy["score"];
  notes: string[];
  rendered_at: string;
};

export type CoverResult =
  | { ok: true; url: string; spec: StoredCoverSpec }
  | { ok: false; error: string; locked?: boolean };

const PHOTO_TYPES = new Set(["image/png", "image/jpeg"]);
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The photo URL is typed by a user and fetched by the server, so only a
 * public https host by name is fetched: no localhost, no IP literal, no
 * redirects to somewhere else.
 */
function isPublicHttps(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && !u.port && host.includes(".") && !/^[\d.]+$/.test(host) && !host.includes(":") && !/(^|\.)(localhost|local|internal)$/.test(host);
  } catch {
    return false;
  }
}

// Brand images are fetched on every edit and every tile; the same few are read
// again within seconds, so they are kept for a minute per instance.
const IMAGE_TTL_MS = 60_000;
const images = new Map<string, { at: number; image: Promise<{ data: Buffer; type: string } | null> }>();

function fetchImage(url: string): Promise<{ data: Buffer; type: string } | null> {
  const hit = images.get(url);
  if (hit && Date.now() - hit.at < IMAGE_TTL_MS) return hit.image;
  const image = fetchImageNow(url).then((img) => {
    // A failure is not remembered: the next draw tries again.
    if (!img && images.get(url)?.image === image) images.delete(url);
    return img;
  });
  images.set(url, { at: Date.now(), image });
  if (images.size > 12) images.delete(images.keys().next().value as string);
  return image;
}

async function fetchImageNow(url: string): Promise<{ data: Buffer; type: string } | null> {
  if (!isPublicHttps(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "error" });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !PHOTO_TYPES.has(type)) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return data.length <= PHOTO_MAX_BYTES ? { data, type } : null;
  } catch {
    return null;
  }
}

/**
 * The logo or headshot as a data URL, copied into R2 the first time a given
 * logo URL is seen (an imported LinkedIn photo URL expires within weeks).
 * Undefined when there is none or it cannot be fetched: the cover then shows
 * an initials monogram rather than failing.
 */
const onOurStorage = (url: string) => {
  const domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
  return Boolean(domain && url.startsWith(`${domain}/`));
};

const asDataUrl = (img: { data: Buffer; type: string }) => `data:${img.type};base64,${img.data.toString("base64")}`;

async function coverPhoto(profile: { id: string; clientId: string | null; primaryLogoUrl: string; coverPhotoUrl: string | null; coverPhotoSource: string | null }): Promise<string | undefined> {
  const source = profile.primaryLogoUrl.trim();
  if (!/^https:\/\//.test(source)) return undefined;
  // An uploaded photo already lives in R2; only an outside URL is copied.
  const hosted = onOurStorage(source) ? source : profile.coverPhotoSource === source ? profile.coverPhotoUrl : null;
  if (!hosted) {
    const original = await fetchImage(source);
    if (!original) return undefined;
    const ext = original.type === "image/png" ? "png" : "jpg";
    const { url } = await uploadToR2(`brand/${profile.clientId ?? profile.id}/cover-photo-${Date.now()}.${ext}`, original.data, original.type);
    await prisma.brandProfile.update({ where: { id: profile.id }, data: { coverPhotoUrl: url, coverPhotoSource: source } });
    return asDataUrl(original);
  }
  const img = await fetchImage(hosted);
  return img ? asDataUrl(img) : undefined;
}

/**
 * The brand's cut-out photo (Brand page, kept in visualAssets), trimmed and
 * ready for the Cut-out banner. Undefined when there is none, it is not on
 * our storage, or it is not really cut out.
 */
export async function coverCutout(profile: { visualAssets: unknown }): Promise<CoverSpec["cutout"]> {
  const url = (profile.visualAssets as { cover_cutout_url?: unknown } | null)?.cover_cutout_url;
  if (typeof url !== "string" || !onOurStorage(url)) return undefined;
  const img = await fetchImage(url);
  return img ? prepareCutout(img.data) : undefined;
}

/**
 * The headshot already copied to our storage, as a data URL, without copying
 * or saving anything: for callers that must not write (the carousel). Undefined
 * when the photo has not been hosted yet, so the slide shows the monogram.
 */
export async function hostedCoverPhoto(profile: { primaryLogoUrl: string; coverPhotoUrl: string | null; coverPhotoSource: string | null }): Promise<string | undefined> {
  const source = profile.primaryLogoUrl.trim();
  if (!/^https:\/\//.test(source)) return undefined;
  const hosted = onOurStorage(source) ? source : profile.coverPhotoSource === source ? profile.coverPhotoUrl : null;
  const img = hosted ? await fetchImage(hosted) : null;
  return img ? asDataUrl(img) : undefined;
}

/** "Founder of Minions.AI." -- the positioning's first sentence, if it is short enough for the author line. */
export function defaultByline(positioning: string): string | undefined {
  const first = positioning.trim().split(/(?<=[.!?])\s+(?=[A-Z])/)[0]?.trim();
  return first && first.length <= 90 ? first.replace(/\.$/, "") : undefined;
}

/** The draft body without the cover image line it carries once a cover is attached. */
export { bodyOf };

/** The asset's content with its cover line set to url (replacing an old one). */
export function withCoverLine(content: string, title: string, url: string): string {
  const alt = (title || "Cover image").replace(/[[\]]/g, "");
  return `![${alt}](${url})\n\n${bodyOf(content)}`;
}

/** A Jev yes above this counts. */
const JEV_YES = 0.7;

/**
 * Whether the figure or the quote makes the post's point on its own, for its
 * reader, better than the headline. Jev judges; without Jev the answer is no,
 * so the headline carries the cover.
 */
async function judgeOptions(options: ReturnType<typeof coverOptions>, headline: string, reader: string): Promise<{ number?: boolean; quote?: boolean }> {
  if (!options.number && !options.quote) return {};
  const numberCover = options.number ? `${options.number.value}${options.number.unit ? ` ${options.number.unit}` : ""}: ${options.number.caption}` : undefined;
  const answers = await askJev(
    { reader, headline, ...(numberCover ? { number_cover: numberCover } : {}), ...(options.quote ? { quote: options.quote } : {}) },
    {
      ...(numberCover
        ? {
            number_alone: { type: "noul" as const, instructions: "The reader scrolls past a LinkedIn post whose image shows only number_cover: the big figure and its caption, nothing else. Would they know at once what was measured and why it matters to them?" },
            number_better: { type: "noul" as const, instructions: "Would number_cover make this reader stop and read more than headline would?" },
          }
        : {}),
      ...(options.quote
        ? {
            quote_alone: { type: "noul" as const, instructions: "The reader sees only quote on a LinkedIn image, with no post around it. Does it make a complete point about a problem or result this reader cares about, without needing context?" },
            quote_better: { type: "noul" as const, instructions: "Would quote make this reader stop and read more than headline would?" },
          }
        : {}),
    }
  );
  const yes = (k: string) => (answers?.[k]?.noul ?? 0) >= JEV_YES;
  return { number: yes("number_alone") && yes("number_better"), quote: yes("quote_alone") && yes("quote_better") };
}

/** The cover is drawn inside 02's 60 s cover call; the line is skipped rather than late. */
const COVER_LINE_BUDGET_MS = 20_000;

function parseLines(raw: string): ProposedCoverLine[] {
  try {
    return parseCoverLines(String(JSON.parse(raw)?.choices?.[0]?.message?.content ?? ""));
  } catch {
    return [];
  }
}

/**
 * A 3-6 word cover line written from the finished post: Qwen proposes five,
 * code drops any that break checkCoverLine, and Jev rates how plainly each
 * says what the post is about. The clearest line is used when Jev rates it clear,
 * even if the long title also reads clearly: posters carry a short, punchy line. "" when none is,
 * undefined when Qwen or Jev did not answer (so the next draw tries again).
 * The line comes with the word Qwen said to set in the accent colour.
 */
export async function writeCoverLine(draft: { title: string; post: string; body: string }, current: string, notes: string[]): Promise<ProposedCoverLine | undefined> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return undefined;
  const call = chatWithFallback(renderCoverLine({ title: draft.title, post: draft.post }), apiKey).then((res) => (res.status < 300 ? parseLines(res.body) : []));
  const timeout = new Promise<ProposedCoverLine[]>((resolve) => setTimeout(() => resolve([]), COVER_LINE_BUDGET_MS));
  const proposed = await Promise.race([call, timeout]).catch(() => [] as ProposedCoverLine[]);
  const accents = new Map<string, string | undefined>();
  for (const p of proposed) {
    const l = p.line.trim().replace(/[.]+$/, "").replace(/^\p{Ll}/u, (c) => c.toUpperCase());
    if (!accents.has(l)) accents.set(l, p.accent);
  }
  const usable = [...accents.keys()].filter((l) => {
    const why = checkCoverLine(l, draft.body);
    if (why) notes.push(`Cover line "${l}" not used: ${why}.`);
    return !why;
  });
  if (!proposed.length) return undefined;
  if (!usable.length) return { line: "" };
  const lines = [current, ...usable];
  const answers = await askJev(
    { title: draft.title, post: draft.post.slice(0, 3000), ...Object.fromEntries(lines.map((l, i) => [`line_${i}`, l])) },
    Object.fromEntries(lines.map((_, i) => [`clear_${i}`, { type: "noul" as const, instructions: `Someone sees only line_${i} on a LinkedIn image. Does it tell them, in plain words, what the post is about?` }]))
  );
  // Without Jev nothing says a line is clearer, so the headline stays for now.
  if (!answers) return undefined;
  const p = (i: number) => answers[`clear_${i}`]?.noul ?? 0;
  const line = pickCoverLine(usable.map((l, i) => ({ l, p: p(i + 1) })), p(0), JEV_YES);
  if (!line) notes.push("No cover line used: none of the short lines says plainly what the post is about.");
  return { line, accent: line ? accents.get(line) : undefined };
}

/** Read alongside the cover line, inside the same 60 s cover call. */
const SHAPE_BUDGET_MS = 20_000;

/**
 * What the post holds that a poster can show (shape.ts), with every part
 * checked against the draft. Undefined when the model did not answer in
 * time, so the next draw tries again.
 */
export async function readPosterShape(draft: { title: string; post: string; body: string }, notes: string[]): Promise<PosterShape | undefined> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return undefined;
  const call = chatWithFallback(renderPosterShape({ title: draft.title, post: draft.post }), apiKey).then((res) => (res.status < 300 ? shapeJson(res.body) : null));
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SHAPE_BUDGET_MS));
  const raw = await Promise.race([call, timeout]).catch(() => null);
  return raw ? parseShape(raw, draft.body, notes) : undefined;
}

export async function renderAssetCover(assetId: string, input: { card?: CoverCard; edit?: CoverEdit } = {}): Promise<CoverResult> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true, clientId: true, title: true, hook: true, content: true, linkedinVariant: true, claimsOk: true, coverSpec: true, heroAttempts: true,
      heroImageUrl: true, slug: true, status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true,
      idea: { select: { tags: true } },
    },
  });
  if (!asset) return { ok: false, error: `Asset ${assetId} not found` };
  if (!asset.clientId) return { ok: false, error: `Asset ${assetId} has no workspace` };
  // A blog row is the only reliable record that a post is live; the asset's own status lags.
  const onBlog = await prisma.blog.findFirst({ where: { clientId: asset.clientId, OR: [{ assetId: asset.id }, { slug: asset.slug }] }, select: { slug: true } });
  if (onBlog || isPublished(asset)) return { ok: false, error: PUBLISHED_COVER_LOCKED, locked: true };

  const [profile, icp, recent] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId: asset.clientId } }),
    prisma.icpProfile.findUnique({ where: { clientId: asset.clientId } }),
    prisma.asset.findMany({
      where: { clientId: asset.clientId, id: { not: asset.id }, heroProvider: COVER_PROVIDER },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { coverSpec: true },
    }),
  ]);
  if (!profile) return { ok: false, error: "The workspace has no brand profile" };

  const previous = (asset.coverSpec ?? null) as Partial<StoredCoverSpec> | null;
  let card: CoverCard = input.card ?? previous?.card ?? {};
  const body = bodyOf(asset.content ?? "");
  const icpFields = { who: icp?.who ?? "", role: icp?.role ?? "", company_type: icp?.companyType ?? "" };
  const reader = [icpFields.who, icpFields.role, icpFields.company_type].filter(Boolean).join("; ");
  const lineNotes: string[] = [];
  // The first post's cover is the dark STATEMENT with Shapes: the boldest
  // first impression, with no picked figure or quote (user decision,
  // 2026-10-01). A reviewer's edit still changes it.
  const firstPost = !input.edit && Boolean(asset.idea?.tags.includes(FIRST_POST_TAG));
  const copyInput = {
    card,
    title: asset.title ?? "",
    hook: asset.hook ?? "",
    body,
    post: asset.linkedinVariant ?? undefined,
    claimsOk: asset.claimsOk ?? "N",
    icp: icpFields,
    recentLayouts: recent.map((r) => (r.coverSpec as { layout?: string } | null)?.layout ?? "").filter(Boolean),
    ...(firstPost ? { layout: "STATEMENT" as const } : {}),
  };
  // Written once per draft and kept on the card (an empty string records
  // that none beat the headline); written again only when the draft no longer
  // supports it. A reviewer's edit never rewrites it.
  let lineCostUsd = 0;
  const post = quoteSource({ body, post: asset.linkedinVariant });
  // Every figure on a poster must be in the draft or the LinkedIn post beside it.
  const shapeBody = `${body}\n${asset.linkedinVariant ?? ""}`;
  const shapeNotes: string[] = [];
  const needsLine = !input.edit && (card.cover_line === undefined || (card.cover_line && checkCoverLine(card.cover_line, body)));
  // The shape is read once per draft, beside the cover line; an edit reads it
  // only when the reviewer asks for a type that needs it (below).
  const needsShape = !input.edit && card.shape === undefined;
  const [lineRun, shapeRun] = await Promise.all([
    needsLine
      ? withCostMeter(() => writeCoverLine({ title: asset.title ?? "", post, body }, chooseCoverCopy({ ...copyInput, card: { ...card, cover_line: undefined } }).headline, lineNotes))
      : null,
    needsShape ? withCostMeter(() => readPosterShape({ title: asset.title ?? "", post, body: shapeBody }, shapeNotes)) : null,
  ]);
  lineCostUsd = (lineRun?.costUsd ?? 0) + (shapeRun?.costUsd ?? 0);
  if (lineRun?.value) card = { ...card, cover_line: lineRun.value.line, cover_line_emphasis: lineRun.value.accent };
  if (shapeRun?.value) card = { ...card, shape: shapeRun.value };
  copyInput.card = card;
  // Judged only when the layout is being chosen: an edit keeps the drawn one.
  const headlineCopy = chooseCoverCopy(copyInput);
  const judged = firstPost || input.edit ? {} : await judgeOptions(coverOptions(copyInput), headlineCopy.headline, reader);
  const copy = judged.number || judged.quote ? chooseCoverCopy({ ...copyInput, judged }) : headlineCopy;

  // The illustration. A re-draw keeps the one the cover has unless the
  // reviewer changes the style or asks for another.
  const artStyle = input.edit?.art ?? (firstPost ? "SHAPES" : null) ?? parseArtStyle(previous?.art_style) ?? parseArtStyle(profile.coverArt) ?? DEFAULT_COVER_ART_STYLE;
  const reroll = Boolean(input.edit?.art_reroll);
  let art: CoverSpec["art"];
  if (previous?.art && previous.art_style === artStyle && !reroll) art = previous.art;
  else {
    const seed = reroll ? `${asset.id}:${Date.now()}` : asset.id;
    const recentMotifs = recent.map((r) => (r.coverSpec as Partial<StoredCoverSpec> | null)?.art?.choice.motif ?? "").filter(Boolean);
    const exclude = reroll && previous?.art_style === artStyle ? previous?.art?.choice.motif : undefined;
    const choice = chooseArt(artStyle, [copy.headline, asset.title, asset.hook].filter(Boolean).join(" "), seed, recentMotifs, exclude, card.physical_scene ?? "", (artStyle === "DOODLES" ? card.doodle_motif : artStyle === "ICONS" ? card.icon_motif : card.shape_motif) ?? "");
    art = choice ? { choice, seed } : undefined;
  }

  const { brand, notes: brandNotes } = coverBrand({ ink: profile.primaryInk, paper: profile.brandCream, accent: profile.brandCoral, secondary: profile.brandTeal });
  const author = {
    name: profile.brandName,
    role: profile.coverByline?.trim() || defaultByline(profile.positioning ?? ""),
    photo: await coverPhoto(profile),
  };
  const photoOk = dataUrlFitsPoster(author.photo);
  const cutout = await coverCutout(profile);

  // The poster type (posterType.ts): what the post holds decides which types
  // fit, and the one this workspace used least recently wins. A figure or
  // quote counts only when copy.ts chose it after Jev's judgement.
  const typeInput = {
    shape: card.shape,
    judged: { number: copy.layout === "NUMBER", quote: copy.layout === "QUOTE" },
    photoOk,
    cutoutOk: Boolean(cutout),
    recent: copyInput.recentLayouts,
    firstPost,
  };
  const order = fallbackOrder(pickPosterType(typeInput), eligibleTypes(typeInput));
  /** The cover drawn as one type: the figure or quote copy for its own type, the headline copy for the rest. */
  const specFor = (layout: CoverLayout): CoverSpec => {
    const c = layout === copy.layout ? copy : headlineCopy;
    return {
      layout,
      headline: c.headline,
      emphasis: c.emphasis,
      kicker: c.kicker,
      quote: c.quote,
      number: c.number ?? copy.number,
      author,
      brand,
      // Only Headline and Statement have room for an illustration.
      art: layout === "HEADLINE" || layout === "STATEMENT" ? art : undefined,
      ...posterParts(card.shape),
      cutout,
    };
  };

  // A reviewer's edit changes one thing on the cover they are looking at: the
  // rest (layout, headline, subtitle) stays as drawn, never re-picked.
  const kept = input.edit && previous?.layout && previous.headline ? previous : null;
  // No audience label: the illustration and the headline open the cover (user decision, 2026-09-25).
  let spec: CoverSpec = kept
    ? { layout: kept.layout!, headline: kept.headline!, emphasis: kept.emphasis, kicker: kept.kicker, quote: kept.quote, number: kept.number, author, brand, art, ...posterParts(card.shape), cutout }
    : input.edit
      ? { ...specFor(copy.layout), art }
      : specFor(order[0]);
  const notes = [...lineNotes, ...shapeNotes, ...copy.notes, ...brandNotes];
  let headlineSource: StoredCoverSpec["headline_source"] = kept?.headline_source ?? copy.headline_source;
  let score = kept?.score ?? copy.score;

  // A reviewer's edit. It passes the same honesty checks as generated copy:
  // no figure the draft does not state, a quote only from the body.
  const edit = input.edit;
  if (edit) {
    const figures = (t: string) => numbersIn(t).filter((n) => !numbersIn(body).includes(n));
    if (edit.headline !== undefined) {
      const bad = figures(edit.headline);
      if (bad.length) return { ok: false, error: `The headline states ${bad.join(", ")}, which the draft does not.` };
      spec = { ...spec, headline: edit.headline.trim(), emphasis: edit.emphasis };
      score = scoreHeadline(spec.headline, { body, icp: icpFields });
      headlineSource = "reviewer";
    } else if (edit.emphasis !== undefined) spec = { ...spec, emphasis: edit.emphasis || undefined };
    if (edit.kicker !== undefined) {
      const bad = figures(edit.kicker);
      if (bad.length) return { ok: false, error: `The subtitle states ${bad.join(", ")}, which the draft does not.` };
      spec = { ...spec, kicker: edit.kicker.trim() || undefined };
    }
    // A type or items that need the shape: read it now if this draft never had it.
    const wantsShape = Boolean(edit.list || edit.grid_labels || edit.punch || (edit.layout && NEEDS_SHAPE[edit.layout]));
    if (wantsShape && card.shape === undefined) {
      const metered = await withCostMeter(() => readPosterShape({ title: asset.title ?? "", post, body: shapeBody }, notes));
      lineCostUsd += metered.costUsd;
      if (!metered.value) return { ok: false, error: "Could not read the post's points just now. Try again in a minute." };
      card = { ...card, shape: metered.value };
    }
    if (card.shape && (edit.list || edit.grid_labels || edit.punch)) {
      const changed = editShape(card.shape, edit, shapeBody);
      if ("error" in changed) return { ok: false, error: changed.error };
      card = { ...card, shape: changed.shape };
    }
    spec = { ...spec, ...posterParts(card.shape) };
    if (edit.layout) {
      const switched = switchLayout(spec, edit.layout, { shape: card.shape, photo: { present: Boolean(author.photo), ok: photoOk }, cutout: Boolean(cutout), body, post: asset.linkedinVariant });
      if (!switched.ok) return { ok: false, error: switched.error };
      spec = switched.spec;
    }
  }

  // Generated: each type in order (its own copy only), the last with every
  // fallback down to the plain headline. An edit keeps the type it asked for;
  // only the four original types fall back to the plain headline.
  const title = asset.title ?? "";
  const tries = !input.edit
    ? order.flatMap((l, i) => (i === order.length - 1 ? attempts(specFor(l), title) : sameType(specFor(l), title)))
    : editAttempts(spec, title);
  let png: Buffer | null = null;
  let used = spec;
  for (const attempt of tries) {
    try {
      png = await renderCoverPng(attempt);
      used = attempt;
      break;
    } catch (e) {
      if (!(e instanceof CoverFitError)) throw e;
      notes.push(e.message);
    }
  }
  if (!png) return { ok: false, error: input.edit && spec.layout !== "HEADLINE" ? `That doesn't fit on a ${spec.layout.toLowerCase()} cover: ${notes.slice(-1)[0] ?? "unknown"}. Try shorter wording.` : `No cover copy fits: ${notes.slice(-1)[0] ?? "unknown"}` };

  const { url } = await uploadToR2(`covers/${asset.clientId}/${asset.id}-${Date.now()}.png`, png, "image/png");
  const stored: StoredCoverSpec = {
    ...used,
    // The cut-out is the brand's, read again on every draw: never copied into the row.
    cutout: undefined,
    author: { name: author.name, role: author.role, has_photo: Boolean(author.photo), photo_ok: photoOk, cutout_ok: Boolean(cutout) },
    // The chosen art is kept even when this layout or fit dropped it, so switching back restores it.
    art: used.art ?? spec.art ?? art,
    art_style: artStyle,
    art_drawn: Boolean(used.art) && (used.layout === "HEADLINE" || used.layout === "STATEMENT"),
    card,
    headline_source: used.headline === spec.headline ? headlineSource : "title",
    score,
    notes,
    rendered_at: new Date().toISOString(),
  };
  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      heroStatus: "READY",
      heroImageUrl: url,
      heroProvider: COVER_PROVIDER,
      heroErrorCode: null,
      heroAttempts: (asset.heroAttempts ?? 0) + 1,
      coverSpec: stored as object,
      content: withCoverLine(asset.content ?? "", asset.title ?? "", url),
      // The cover line's model call counts toward the post's generation cost.
      ...(lineCostUsd ? { generationCost: { increment: lineCostUsd } } : {}),
      updatedAt: new Date(),
    },
  });
  // The reviewer does not wait for the old file to be cleaned up.
  background(() => dropReplacedCover(asset.id, asset.heroImageUrl, url));
  return { ok: true, url, spec: stored };
}

/**
 * Reads the post's points onto a cover drawn before they were read, without
 * redrawing it, so the Studio knows whether List, Grid and Punch can be
 * offered. Once per draft: a cover that has them is left alone.
 */
export async function readCoverShape(assetId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { title: true, content: true, linkedinVariant: true, coverSpec: true } });
  const spec = asset?.coverSpec as Partial<StoredCoverSpec> | null | undefined;
  if (!asset || !spec?.layout) return { ok: false, error: "This draft has no cover yet." };
  if (spec.card?.shape !== undefined) return { ok: true };
  const body = bodyOf(asset.content ?? "");
  const notes: string[] = [];
  const metered = await withCostMeter(() =>
    readPosterShape({ title: asset.title ?? "", post: quoteSource({ body, post: asset.linkedinVariant }), body: `${body}\n${asset.linkedinVariant ?? ""}` }, notes)
  );
  if (!metered.value) return { ok: false, error: "Could not read the post's points just now." };
  const stored: Partial<StoredCoverSpec> = { ...spec, card: { ...(spec.card ?? {}), shape: metered.value } };
  await prisma.asset.update({
    where: { id: assetId },
    data: { coverSpec: stored as object, ...(metered.costUsd ? { generationCost: { increment: metered.costUsd } } : {}) },
  });
  return { ok: true };
}

/**
 * Redraws the cover when a change to the draft left it behind (its quote is
 * gone, it states a figure the post no longer does, or it shows an old
 * title), so what is approved and posted always matches. A reviewer's own
 * headline is kept when it is still true. True when it redrew the cover.
 */
export async function refreshCoverIfStale(assetId: string): Promise<boolean> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { title: true, content: true, linkedinVariant: true, coverSpec: true, heroProvider: true } });
  const spec = asset?.coverSpec as Partial<StoredCoverSpec> | null | undefined;
  if (!asset || !spec || asset.heroProvider !== COVER_PROVIDER) return false;
  const draft = { title: asset.title ?? "", body: bodyOf(asset.content ?? ""), post: asset.linkedinVariant };
  const why = coverOutOfDate(spec, draft);
  if (!why) return false;
  const reviewerHeadline = spec.headline_source === "reviewer" && spec.headline && !coverOutOfDate({ headline: spec.headline }, draft);
  // The post changed, so its points are read again when next needed.
  const card = spec.card ? { card: { ...spec.card, shape: undefined } } : {};
  const result = reviewerHeadline
    ? await renderAssetCover(assetId, { ...card, edit: { headline: spec.headline, emphasis: spec.emphasis, kicker: coverOutOfDate({ kicker: spec.kicker }, draft) ? "" : undefined, layout: spec.layout && ["QUOTE", "NUMBER", "LIST", "GRID", "PUNCH"].includes(spec.layout) ? "STATEMENT" : undefined } })
    : await renderAssetCover(assetId, card);
  if (!result.ok) console.warn(`[cover] ${assetId} is out of date (${why}) and could not be redrawn: ${result.error}`);
  return result.ok;
}

const PUBLISHED_COVER_LOCKED = "This draft is published, so its cover stays as it went out.";

/**
 * Once a draft has gone out anywhere, its cover is fixed: the blog page and the
 * posts point at that exact file, so it can be neither redrawn nor deleted.
 */
export function isPublished(asset: { status: string; publishedAt: Date | null; linkedinPublishedAt: Date | null; facebookPublishedAt: Date | null }): boolean {
  return asset.status === "PUBLISHED" || Boolean(asset.publishedAt || asset.linkedinPublishedAt || asset.facebookPublishedAt);
}

/**
 * A redraw uploads under a new key (so no CDN or browser serves the old picture),
 * which would leave the old cover in R2 forever. Redraws only happen before
 * publishing, so nothing public points at the old file and it is deleted once the
 * new one is saved. Only our own drawn covers are touched, never an uploaded
 * photo or a paid AI image, and only this draft's own file: a second post
 * starts out sharing the original's cover. A failed delete never fails the redraw.
 */
async function dropReplacedCover(assetId: string, oldUrl: string | null, newUrl: string): Promise<void> {
  const key = r2KeyFromUrl(oldUrl);
  if (!key || !key.startsWith("covers/") || !key.includes(`/${assetId}-`) || oldUrl === newUrl) return;
  try {
    await deleteFromR2(key);
  } catch (e) {
    console.warn(`[cover] could not delete the replaced cover ${key} of ${assetId}:`, e);
  }
}

/** Records a cover that could not be drawn, so the draft does not wait on it forever. */
export async function markCoverFailed(assetId: string, error: string): Promise<void> {
  await prisma.asset.updateMany({
    where: { id: assetId, heroStatus: "PENDING" },
    data: { heroStatus: "FAILED", heroErrorCode: error.slice(0, 240), heroProvider: COVER_PROVIDER, updatedAt: new Date() },
  });
}

/**
 * A sample cover in the workspace's look, for the Brand page: the same
 * renderer, frame and checks as a real cover, with unsaved colours, byline
 * and photo applied, so a change is seen exactly as it will be posted.
 */
export async function renderCoverPreview(
  clientId: string,
  look: { brand_name?: string; primary_ink?: string; brand_cream?: string; brand_coral?: string; brand_teal?: string; cover_byline?: string; primary_logo_url?: string; positioning?: string; cover_art?: string }
): Promise<{ png: Buffer; notes: string[] }> {
  const profile = await prisma.brandProfile.findUnique({ where: { clientId } });
  const { brand, notes } = coverBrand({
    ink: look.primary_ink ?? profile?.primaryInk,
    paper: look.brand_cream ?? profile?.brandCream,
    accent: look.brand_coral ?? profile?.brandCoral,
    secondary: look.brand_teal ?? profile?.brandTeal,
  });
  const logo = (look.primary_logo_url ?? profile?.primaryLogoUrl ?? "").trim();
  // Only https images; an unsaved outside URL is fetched for the preview but not copied.
  const image = /^https:\/\//.test(logo) ? await fetchImage(logo) : null;
  const byline = (look.cover_byline ?? profile?.coverByline ?? "").trim() || defaultByline(look.positioning ?? profile?.positioning ?? "");
  const artStyle = parseArtStyle(look.cover_art) ?? parseArtStyle(profile?.coverArt) ?? DEFAULT_COVER_ART_STYLE;
  const choice = chooseArt(artStyle, "", clientId);
  const png = await renderCoverPng({
    layout: "HEADLINE",
    art: choice ? { choice, seed: clientId } : undefined,
    headline: "Your post's claim appears here, in your type",
    emphasis: "claim",
    kicker: "One line under it says what the reader gets.",
    author: { name: (look.brand_name ?? profile?.brandName ?? "Your name").trim() || "Your name", role: byline, photo: image ? asDataUrl(image) : undefined },
    brand,
  });
  if (logo && !image) notes.push("The logo or photo could not be loaded (it must be a PNG or JPEG at an https address); initials are shown instead.");
  return { png, notes };
}
