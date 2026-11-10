import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { chat as qwenChat } from "@/lib/ai/qwen";
import { withCostMeter } from "@/lib/ai/cost";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/r2";
import { coverBrand } from "@/lib/covers/brand";
import type { CoverSpec } from "@/lib/covers/layouts";
import { evidenceRules, manualIdeaNote } from "@/lib/drafts/authorContext";
import { COVER_HEADLINE_WORDS, checkPlan, namesIn, parsePlan, repairPlan, suggestCarousel, toDeck, type CarouselPlan, type PlanSources } from "@/lib/carousel/plan";
import { renderCarouselPdf, renderSlidePng, slideJpeg } from "@/lib/carousel/render";
import type { Deck, SlideStyle } from "@/lib/carousel/slides";
import type { InstagramFormat } from "@/lib/carousel/instagramFormat";
import { renderCarousel, type CarouselInput } from "@/lib/prompts/carousel";
import { bodyOf, defaultByline, hostedCoverPhoto, isPublished } from "./cover";
import { tenantBannedPhrases } from "./bannedScrub";

/**
 * Carousels for a draft (phase 11, D19). The model writes a slide plan once;
 * code gates it, draws it, and stores it. A reviewer's edits pass the same
 * gates and are redrawn with no model call. `active` decides whether LinkedIn
 * gets the carousel (03 posts it as a document) or the cover image. A
 * published draft's carousel is fixed, like its cover.
 */

export interface StoredCarousel {
  /** LinkedIn gets the carousel instead of the cover. */
  active: boolean;
  plan: CarouselPlan;
  /** LinkedIn's document. */
  pdf_url: string;
  /**
   * Each page as an image, cover first: JPEG from 2026-11-10 (for Instagram and
   * Facebook, and the review preview), PNG before 2026-09-29, none in between.
   */
  pages?: string[];
  /** The reviewer's Instagram pick for this draft (task 40); absent means the workspace's default. */
  instagram_format?: InstagramFormat;
  /** Copied from the plan for 03, which reads the row as it is. */
  caption: string;
  document_title: string;
  model: string | null;
  attempts: number;
  rendered_at: string;
}

export type CarouselResult =
  | { ok: true; carousel: StoredCarousel }
  | { ok: false; error: string; errors: string[]; locked?: boolean };

export const CAROUSEL_LOCKED = "This draft is published, so its carousel stays as it went out.";
const COVER_POST_NO_CAROUSEL = "This post shares the cover. The carousel already went out with the first post.";
const CAROUSEL_POST_STAYS_ON = "This post is the carousel's, so the carousel stays on.";
const MAX_ATTEMPTS = 3;
/** The route may run 300s; a retry starts only this soon after the first call, so it can finish. */
const RETRY_CUTOFF_MS = 120_000;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

type Chat = (payload: Record<string, unknown>) => Promise<{ status: number; body: string; model: string }>;

const defaultChat: Chat = (payload) => qwenChat(payload);

interface Context {
  assetId: string;
  clientId: string;
  /** CAROUSEL: a second post that exists to share the carousel. COVER: one that shares the cover, so it has none. */
  followUpFormat: string | null;
  locked: boolean;
  stored: StoredCarousel | null;
  input: CarouselInput;
  sources: PlanSources;
  base: { author: CoverSpec["author"]; brand: CoverSpec["brand"]; art?: CoverSpec["art"] };
  /** The post's own cover headline: the carousel opens with the same title. */
  postCover: { headline: string; emphasis?: string } | null;
  body: string;
}

/** Everything a plan is written from and checked against. Reads only. */
async function loadContext(assetId: string): Promise<Context | { error: string }> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true, clientId: true, ideaId: true, slug: true, title: true, hook: true, coreArgument: true, content: true, coverSpec: true, carouselSpec: true,
      status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true, followUpOf: true, followUpFormat: true,
    },
  });
  if (!asset?.clientId) return { error: `Asset ${assetId} not found` };
  const clientId = asset.clientId;
  // A second post has no idea of its own: it is its original's, and must not echo what that post said.
  const original = asset.followUpOf
    ? await prisma.asset.findFirst({ where: { id: asset.followUpOf, clientId }, select: { ideaId: true, linkedinVariant: true } })
    : null;
  const ideaId = asset.ideaId ?? original?.ideaId ?? null;

  const [profile, icp, idea, banned, claims, onBlog] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId } }),
    prisma.icpProfile.findUnique({ where: { clientId } }),
    ideaId ? prisma.idea.findFirst({ where: { id: ideaId, clientId }, select: { memoryIds: true, trustBasis: true, source: true, gateVerdict: true, rawIdea: true, angle: true, why: true } }) : null,
    tenantBannedPhrases(clientId),
    prisma.claim.findMany({ where: { assetId: asset.id, verified: { not: "Y" } }, select: { claimText: true } }),
    prisma.blog.findFirst({ where: { clientId, OR: [{ assetId: asset.id }, { slug: asset.slug }] }, select: { slug: true } }),
  ]);
  if (!profile) return { error: "The workspace has no brand profile" };

  // Only memory that may be shown: a GENERALIZE item only in its stored, stripped form.
  const rows = idea?.memoryIds.length
    ? await prisma.professionalMemory.findMany({ where: { clientId, id: { in: idea.memoryIds }, isActive: true }, select: { content: true, disclosure: true, generalizedContent: true } })
    : [];
  const memory = rows.map((m) => (m.disclosure === "GENERALIZE" ? m.generalizedContent ?? "" : m.content)).filter(Boolean);
  const unverified = claims.map((c) => c.claimText).filter(Boolean);
  const body = bodyOf(asset.content);

  const input: CarouselInput = {
    brand_name: profile.brandName,
    author_name: profile.brandName,
    title: asset.title,
    hook: asset.hook ?? "",
    core_argument: asset.coreArgument ?? "",
    body,
    icp: { who: icp?.who ?? "", role: icp?.role ?? "" },
    memory,
    own_account: memory.length > 0 || Boolean(idea && manualIdeaNote(idea)),
    evidence_rules: evidenceRules({ trust_basis: idea?.trustBasis ?? [], memory: memory.map((text) => ({ kind: "", text, disclosure: "PUBLIC" as const })) }),
    banned,
    unverified,
    ...(original?.linkedinVariant ? { posted_post: original.linkedinVariant } : {}),
  };
  const sources: PlanSources = { texts: [body, asset.hook ?? "", asset.coreArgument ?? "", asset.title], memory, banned, unverified, names: namesIn(asset.title).filter((n) => body.includes(n)) };

  // The cover page keeps the post's own illustration; the author and colours are the workspace's.
  const cover = (asset.coverSpec ?? null) as { art?: CoverSpec["art"]; headline?: string; emphasis?: string } | null;
  const { brand } = coverBrand({ ink: profile.primaryInk, paper: profile.brandCream, accent: profile.brandCoral, secondary: profile.brandTeal });
  const author = { name: profile.brandName, role: profile.coverByline?.trim() || defaultByline(profile.positioning ?? ""), photo: await hostedCoverPhoto(profile) };

  return {
    assetId: asset.id,
    clientId,
    followUpFormat: asset.followUpFormat,
    locked: Boolean(onBlog) || isPublished(asset),
    stored: (asset.carouselSpec ?? null) as StoredCarousel | null,
    input,
    sources,
    base: { author, brand, art: cover?.art },
    postCover: cover?.headline?.trim() && words(cover.headline) >= COVER_HEADLINE_WORDS.min && words(cover.headline) <= COVER_HEADLINE_WORDS.max ? { headline: cover.headline.trim(), emphasis: cover.emphasis } : null,
    body,
  };
}

/** Every gate on a plan, text and fit. Empty: the plan can be drawn. */
function gate(ctx: Context, plan: CarouselPlan): { deck: Deck | null; errors: string[] } {
  const errors = checkPlan(plan, ctx.sources);
  if (errors.length) return { deck: null, errors };
  const built = toDeck(plan, ctx.base);
  return built.errors.length ? { deck: null, errors: built.errors } : { deck: built.deck, errors: [] };
}

/** Draws every page into the PDF and as JPEGs, uploads them under a fresh folder, and saves the row. */
async function renderAndStore(ctx: Context, plan: CarouselPlan, deck: Deck, meta: { active: boolean; model: string | null; attempts: number }, costUsd = 0): Promise<StoredCarousel> {
  const pngs: Buffer[] = [];
  for (let i = 0; i <= deck.slides.length; i++) pngs.push(await renderSlidePng(deck, i));
  const pdf = await renderCarouselPdf(deck, pngs);
  // A new folder per render, so no CDN or browser serves an old PDF.
  const folder = `carousels/${ctx.clientId}/${ctx.assetId}-${Date.now()}`;
  const pdfUpload = await uploadToR2(`${folder}/carousel.pdf`, pdf, "application/pdf");
  // Each page as a JPEG too: Instagram and Facebook post images, not a PDF.
  const pages: string[] = [];
  for (let i = 0; i < pngs.length; i++) {
    const upload = await uploadToR2(`${folder}/${String(i + 1).padStart(2, "0")}.jpg`, await slideJpeg(pngs[i]), "image/jpeg");
    pages.push(upload.url);
  }
  const carousel: StoredCarousel = {
    active: meta.active,
    plan,
    pdf_url: pdfUpload.url,
    pages,
    caption: plan.caption,
    document_title: plan.documentTitle,
    model: meta.model,
    attempts: meta.attempts,
    rendered_at: new Date().toISOString(),
    // A redraw keeps the reviewer's Instagram pick.
    ...(ctx.stored?.instagram_format ? { instagram_format: ctx.stored.instagram_format } : {}),
  };
  // The model calls that planned it count toward the post's generation cost.
  await prisma.asset.update({ where: { id: ctx.assetId }, data: { carouselSpec: carousel as unknown as Prisma.InputJsonValue, ...(costUsd ? { generationCost: { increment: costUsd } } : {}) } });
  await dropReplaced(ctx.assetId, ctx.stored);
  return carousel;
}

/**
 * The files of the carousel just replaced. Only before publishing, so nothing
 * public points at them, and only this draft's own: a second post starts out
 * sharing the original's carousel. A failed delete never fails the save.
 */
async function dropReplaced(assetId: string, old: StoredCarousel | null): Promise<void> {
  if (!old) return;
  for (const url of [old.pdf_url, ...(old.pages ?? [])]) {
    const key = r2KeyFromUrl(url);
    if (!key?.startsWith("carousels/") || !key.includes(`/${assetId}-`)) continue;
    await deleteFromR2(key).catch((e) => console.warn(`[carousel] could not delete ${key}:`, e));
  }
}

type Planned = { ok: true; plan: CarouselPlan; deck: Deck; attempts: number; model: string } | { ok: false; error: string; errors: string[] };

/** The model's plan, repaired in code, through every gate; each retry is told exactly what failed. */
async function planWithModel(ctx: Context, chat: Chat, style?: SlideStyle): Promise<Planned> {
  let errors: string[] = [];
  const started = Date.now();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // A retry only when there is time for it inside the route's limit.
    if (attempt > 1 && Date.now() - started > RETRY_CUTOFF_MS) break;
    const res = await chat({ ...renderCarousel({ ...ctx.input, style, feedback: attempt > 1 ? errors : undefined }) });
    if (res.status >= 400) return { ok: false, error: `The model call failed (${res.status}). Try again in a minute.`, errors: [] };
    let content = "";
    try {
      content = JSON.parse(res.body)?.choices?.[0]?.message?.content ?? "";
    } catch {
      content = "";
    }
    const parsed = parsePlan(content);
    errors = parsed.errors;
    if (!parsed.plan || errors.length) continue;
    // The reviewer's chosen design wins over whatever the model wrote.
    const repaired = { ...repairPlan(parsed.plan, ctx.sources), ...(style ? { style } : {}) };
    // The deck opens with the post's own cover title, so the two never disagree.
    const plan = ctx.postCover ? { ...repaired, cover: { ...repaired.cover, ...ctx.postCover } } : repaired;
    const gated = gate(ctx, plan);
    errors = gated.errors;
    if (gated.deck) return { ok: true, plan, deck: gated.deck, attempts: attempt, model: res.model };
  }
  // The reasons go to the log, not the reviewer: they can only make it again.
  if (errors.length) console.warn(`[carousel] ${ctx.assetId} failed the checks:`, errors);
  return { ok: false, error: "The slides did not come out right this time. Make it again, or LinkedIn posts the cover image.", errors: [] };
}

/** Plans a carousel with the model, draws it and switches it on. `style` is the reviewer's optional choice of design. */
export async function generateCarousel(assetId: string, { chat = defaultChat, style }: { chat?: Chat; style?: SlideStyle } = {}): Promise<CarouselResult> {
  const ctx = await loadContext(assetId);
  if ("error" in ctx) return { ok: false, error: ctx.error, errors: [] };
  if (ctx.locked) return { ok: false, error: CAROUSEL_LOCKED, errors: [], locked: true };
  if (ctx.followUpFormat === "COVER") return { ok: false, error: COVER_POST_NO_CAROUSEL, errors: [], locked: true };
  const { value: planned, costUsd } = await withCostMeter(() => planWithModel(ctx, chat, style));
  if (!planned.ok) return planned;
  return { ok: true, carousel: await renderAndStore(ctx, planned.plan, planned.deck, { active: true, model: planned.model, attempts: planned.attempts }, costUsd) };
}

/** A reviewer's edit: the same gates, redrawn with no model call. Keeps whether it is on. */
export async function editCarousel(assetId: string, plan: CarouselPlan): Promise<CarouselResult> {
  const ctx = await loadContext(assetId);
  if ("error" in ctx) return { ok: false, error: ctx.error, errors: [] };
  if (ctx.locked) return { ok: false, error: CAROUSEL_LOCKED, errors: [], locked: true };
  if (!ctx.stored) return { ok: false, error: "This draft has no carousel yet.", errors: [] };
  const { deck, errors } = gate(ctx, plan);
  if (!deck) return { ok: false, error: "The edit did not pass the checks.", errors };
  return { ok: true, carousel: await renderAndStore(ctx, plan, deck, { active: ctx.stored.active, model: ctx.stored.model, attempts: ctx.stored.attempts }) };
}

/** Whether LinkedIn gets the carousel or the cover image. */
export async function setCarouselActive(assetId: string, active: boolean): Promise<CarouselResult> {
  const ctx = await loadContext(assetId);
  if ("error" in ctx) return { ok: false, error: ctx.error, errors: [] };
  if (ctx.locked) return { ok: false, error: CAROUSEL_LOCKED, errors: [], locked: true };
  if (!ctx.stored) return { ok: false, error: "This draft has no carousel yet.", errors: [] };
  if (ctx.followUpFormat === "CAROUSEL" && !active) return { ok: false, error: CAROUSEL_POST_STAYS_ON, errors: [], locked: true };
  const carousel = { ...ctx.stored, active };
  await prisma.asset.update({ where: { id: ctx.assetId }, data: { carouselSpec: carousel as unknown as Prisma.InputJsonValue } });
  return { ok: true, carousel };
}

/** The review card's view: the carousel, whether one is suggested, and whether it can change. */
export async function carouselState(assetId: string): Promise<{ carousel: StoredCarousel | null; suggested: { yes: boolean; reason: string }; locked: boolean } | { error: string }> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { clientId: true, slug: true, content: true, carouselSpec: true, status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true },
  });
  if (!asset?.clientId) return { error: `Asset ${assetId} not found` };
  const onBlog = await prisma.blog.findFirst({ where: { clientId: asset.clientId, OR: [{ assetId }, { slug: asset.slug }] }, select: { slug: true } });
  return {
    carousel: (asset.carouselSpec ?? null) as StoredCarousel | null,
    suggested: suggestCarousel(bodyOf(asset.content)),
    locked: Boolean(onBlog) || isPublished(asset),
  };
}

/** For scripts: the plan and deck, storing nothing. */
export async function planOnly(assetId: string, { chat = defaultChat }: { chat?: Chat } = {}): Promise<Planned> {
  const ctx = await loadContext(assetId);
  if ("error" in ctx) return { ok: false, error: ctx.error, errors: [] };
  return planWithModel(ctx, chat);
}
