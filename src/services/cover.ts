import { prisma } from "@/lib/prisma";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/r2";
import { coverBrand } from "@/lib/covers/brand";
import { chooseCoverCopy, scoreHeadline, pickQuote, type CoverCard, type CoverCopy } from "@/lib/covers/copy";
import { COVER_LAYOUTS, CoverFitError, type CoverLayout, type CoverSpec } from "@/lib/covers/layouts";
import { renderCoverPng } from "@/lib/covers/render";
import { chooseArt, parseArtStyle, DEFAULT_COVER_ART_STYLE, type CoverArtStyle } from "@/lib/covers/art";
import { numbersIn } from "@/lib/harvest/text";

/**
 * Draws an asset's cover in code and attaches it (phase 5 of
 * docs/product/authority-flywheel-plan.md). Called by 02_idea_to_asset once
 * the draft is saved, and by the dashboard when a reviewer edits the cover.
 * No image model is involved, so a cover costs nothing and takes about a
 * second; 04_hero_image's Qwen path is kept, bypassed, for optional artwork.
 */

export const COVER_PROVIDER = "template";

/** What a reviewer may change on a cover. Everything else comes from the draft and the brand. */
export interface CoverEdit {
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
  author: { name: string; role?: string; has_photo: boolean };
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

async function fetchImage(url: string): Promise<{ data: Buffer; type: string } | null> {
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
export const bodyOf = (content: string) => content.replace(/^!\[[^\]]*\]\([^)]*\)\s*/, "");

/** The asset's content with its cover line set to url (replacing an old one). */
export function withCoverLine(content: string, title: string, url: string): string {
  const alt = (title || "Cover image").replace(/[[\]]/g, "");
  return `![${alt}](${url})\n\n${bodyOf(content)}`;
}

/**
 * Specs to try, best first. A spec throws CoverFitError when its copy cannot
 * fit; the next one drops the kicker, then uses the title, then the plain
 * HEADLINE layout, so a draft always gets a cover when any honest copy fits.
 */
function attempts(spec: CoverSpec, title: string): CoverSpec[] {
  // Each option is tried with the illustration first, then without it: the
  // headline and subtitle carry the post, the picture does not.
  return copyAttempts(spec, title).flatMap((s) => (s.art ? [s, { ...s, art: undefined }] : [s]));
}

function copyAttempts(spec: CoverSpec, title: string): CoverSpec[] {
  const out = [spec];
  if (spec.kicker) out.push({ ...spec, kicker: undefined });
  if (title && title !== spec.headline) out.push({ ...spec, layout: spec.layout === "STATEMENT" ? "STATEMENT" : "HEADLINE", headline: title, emphasis: undefined, kicker: undefined, quote: undefined, number: undefined });
  out.push({ ...spec, layout: "HEADLINE", headline: title || spec.headline, emphasis: undefined, kicker: undefined, quote: undefined, number: undefined, label: undefined });
  return out;
}

export async function renderAssetCover(assetId: string, input: { card?: CoverCard; edit?: CoverEdit } = {}): Promise<CoverResult> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true, clientId: true, title: true, hook: true, content: true, claimsOk: true, coverSpec: true, heroAttempts: true,
      heroImageUrl: true, slug: true, status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true,
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
      take: 6,
      select: { coverSpec: true },
    }),
  ]);
  if (!profile) return { ok: false, error: "The workspace has no brand profile" };

  const previous = (asset.coverSpec ?? null) as Partial<StoredCoverSpec> | null;
  const card: CoverCard = input.card ?? previous?.card ?? {};
  const body = bodyOf(asset.content ?? "");
  const icpFields = { who: icp?.who ?? "", role: icp?.role ?? "", company_type: icp?.companyType ?? "" };
  const copy = chooseCoverCopy({
    card,
    title: asset.title ?? "",
    hook: asset.hook ?? "",
    body,
    claimsOk: asset.claimsOk ?? "N",
    icp: icpFields,
    recentLayouts: recent.map((r) => (r.coverSpec as { layout?: string } | null)?.layout ?? "").filter(Boolean),
  });

  // The illustration. A re-draw keeps the one the cover has unless the
  // reviewer changes the style or asks for another.
  const artStyle = input.edit?.art ?? parseArtStyle(previous?.art_style) ?? parseArtStyle(profile.coverArt) ?? DEFAULT_COVER_ART_STYLE;
  const reroll = Boolean(input.edit?.art_reroll);
  let art: CoverSpec["art"];
  if (previous?.art && previous.art_style === artStyle && !reroll) art = previous.art;
  else {
    const seed = reroll ? `${asset.id}:${Date.now()}` : asset.id;
    const recentMotifs = recent.map((r) => (r.coverSpec as Partial<StoredCoverSpec> | null)?.art?.choice.motif ?? "").filter(Boolean);
    const exclude = reroll && previous?.art_style === artStyle ? previous?.art?.choice.motif : undefined;
    const choice = chooseArt(artStyle, [copy.headline, asset.title, asset.hook].filter(Boolean).join(" "), seed, recentMotifs, exclude);
    art = choice ? { choice, seed } : undefined;
  }

  const { brand, notes: brandNotes } = coverBrand({ ink: profile.primaryInk, paper: profile.brandCream, accent: profile.brandCoral, secondary: profile.brandTeal });
  const author = {
    name: profile.brandName,
    role: profile.coverByline?.trim() || defaultByline(profile.positioning ?? ""),
    photo: await coverPhoto(profile),
  };

  // A reviewer's edit changes one thing on the cover they are looking at: the
  // rest (layout, headline, subtitle) stays as drawn, never re-picked.
  const kept = input.edit && previous?.layout && previous.headline ? previous : null;
  const base = kept ?? copy;
  // No audience label: the illustration and the headline open the cover (user decision, 2026-09-25).
  let spec: CoverSpec = { layout: base.layout!, headline: base.headline!, emphasis: base.emphasis, kicker: base.kicker, quote: base.quote, number: base.number, author, brand, art };
  const notes = [...copy.notes, ...brandNotes];
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
    if (edit.layout) {
      if (!COVER_LAYOUTS.includes(edit.layout)) return { ok: false, error: `Unknown layout ${edit.layout}` };
      if (edit.layout === "NUMBER" && !spec.number) return { ok: false, error: "This draft has no verified figure for a NUMBER cover." };
      if (edit.layout === "QUOTE" && !spec.quote) {
        const quote = pickQuote(body);
        if (!quote) return { ok: false, error: "No sentence in the draft works as a pull quote." };
        spec = { ...spec, quote };
      }
      spec = { ...spec, layout: edit.layout };
    }
  }

  let png: Buffer | null = null;
  let used = spec;
  for (const attempt of attempts(spec, asset.title ?? "")) {
    try {
      png = await renderCoverPng(attempt);
      used = attempt;
      break;
    } catch (e) {
      if (!(e instanceof CoverFitError)) throw e;
      notes.push(e.message);
    }
  }
  if (!png) return { ok: false, error: `No cover copy fits: ${notes.slice(-1)[0] ?? "unknown"}` };

  const { url } = await uploadToR2(`covers/${asset.clientId}/${asset.id}-${Date.now()}.png`, png, "image/png");
  const stored: StoredCoverSpec = {
    ...used,
    author: { name: author.name, role: author.role, has_photo: Boolean(author.photo) },
    // The chosen art is kept even when this layout or fit dropped it, so switching back restores it.
    art: used.art ?? spec.art,
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
      updatedAt: new Date(),
    },
  });
  await dropReplacedCover(asset.id, asset.heroImageUrl, url);
  return { ok: true, url, spec: stored };
}

export const PUBLISHED_COVER_LOCKED = "This draft is published, so its cover stays as it went out.";

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
 * photo or a paid AI image. A failed delete never fails the redraw.
 */
async function dropReplacedCover(assetId: string, oldUrl: string | null, newUrl: string): Promise<void> {
  const key = r2KeyFromUrl(oldUrl);
  if (!key || !key.startsWith("covers/") || oldUrl === newUrl) return;
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
