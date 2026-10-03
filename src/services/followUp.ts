import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { chatContent } from "@/lib/ai/qwen";
import { withCostMeter } from "@/lib/ai/cost";
import { assetDTOSelect, toAssetDTO } from "@/lib/mappers/asset";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { FOLLOW_UP_WORDS, renderFollowUpPost, type FollowUpPostInput } from "@/lib/prompts/followUp";
import { conflict, notFound } from "@/server/http/errors";
import { CAPTION_WORDS } from "@/lib/carousel/plan";
import { bodyOf } from "./cover";
import { ownedAssetWhere } from "./assets";
import { tenantBannedPhrases } from "./bannedScrub";
import { polishText } from "./draftPolish";
import { carouselOf, linkedinWentAs, type FollowUpFormat } from "@/lib/followUp";
import type { StoredCarousel } from "./carousel";

/**
 * A second LinkedIn post of a published draft, in the format the first did not
 * use: its carousel after a cover post, or its cover after a carousel post. It
 * is a new draft that goes to LinkedIn only, through the usual review, with
 * text LinkedIn has not shown yet. The original stays exactly as it went out.
 * Media files are shared with the original, so neither draft deletes a file
 * the other points at (see dropReplacedCover and the carousel's dropReplaced).
 */

export const FOLLOW_UP_LABEL: Record<FollowUpFormat, string> = { CAROUSEL: "carousel", COVER: "cover" };

const words = (s: string) => s.replace(/(^|\s)#\w+/g, " ").trim().split(/\s+/).filter(Boolean).length;

type Write = (input: FollowUpPostInput) => Promise<string | null>;

/** New post text from the model, polished, or null when none came back usable. */
const writeWithModel: Write = async (input) => {
  const raw = await chatContent(renderFollowUpPost(input), "follow-up");
  let post = "";
  try {
    post = String(JSON.parse((raw ?? "").replace(/^```(?:json)?\s*|\s*```$/g, ""))?.post ?? "").trim();
  } catch {
    return null;
  }
  post = post.replace(/\s*[—–]\s*/g, ", ").replace(/\*\*?|`/g, "");
  if (!fits(post, input.format) || post.split("\n")[0].trim() === input.posted.split("\n")[0].trim()) return null;
  const polished = (await polishText(post, "post")).text;
  return fits(polished, input.format) ? polished : post;
};

/** A carousel caption must pass the carousel's own check, hashtags included; a cover post gets some slack. */
function fits(post: string, format: FollowUpFormat): boolean {
  if (format === "CAROUSEL") {
    const all = post.trim().split(/\s+/).filter(Boolean).length;
    return all >= CAPTION_WORDS.min && all <= CAPTION_WORDS.max;
  }
  const n = words(post);
  return n >= FOLLOW_UP_WORDS.COVER.min * 0.8 && n <= FOLLOW_UP_WORDS.COVER.max * 1.15;
}

async function freeSlug(base: string): Promise<string> {
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await prisma.asset.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now()}`;
}

export type FollowUpResult = { created: boolean; asset: ReturnType<typeof toAssetDTO> };

export async function createFollowUp(clientId: string, idOrSlug: string, { write = writeWithModel }: { write?: Write } = {}): Promise<FollowUpResult> {
  const original = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, idOrSlug) });
  if (!original) throw notFound("Draft not found");
  if (original.followUpOf) throw conflict("This is already a second post.");
  const wentAs = linkedinWentAs(original);
  if (!wentAs) throw conflict("This draft has not gone out on LinkedIn yet.");
  const format: FollowUpFormat = wentAs === "CAROUSEL" ? "COVER" : "CAROUSEL";

  const done = async (id: string, created: boolean): Promise<FollowUpResult> => {
    const row = await prisma.asset.findUniqueOrThrow({ where: { id }, select: assetDTOSelect });
    return { created, asset: toAssetDTO(row, null, await getTenantBlogDomain(clientId)) };
  };
  const existing = await prisma.asset.findUnique({ where: { followUpOf: original.id }, select: { id: true } });
  if (existing) return done(existing.id, false);
  if (format === "COVER" && !original.heroImageUrl) throw conflict("This draft has no cover to post.");

  const carousel = carouselOf(original.carouselSpec) ? (original.carouselSpec as unknown as StoredCarousel) : null;
  // The text LinkedIn showed, and the text it has not: the variant beside a cover, the caption above a carousel.
  const posted = wentAs === "CAROUSEL" ? carousel!.caption : (original.linkedinVariant ?? "");
  const unposted = format === "COVER" ? (original.linkedinVariant ?? "") : (carousel?.caption ?? "");
  const banned = await tenantBannedPhrases(clientId);
  // With no carousel yet, the reviewer makes one on the new draft, whose caption is told the first post.
  const needsText = format === "COVER" || Boolean(carousel);
  const { value: fresh, costUsd } = await withCostMeter(async () =>
    needsText ? write({ posted, body: bodyOf(original.content), format, banned }).catch(() => null) : null
  );
  // When no new text came back, the text LinkedIn has not shown yet still goes, never the posted one.
  const text = fresh || unposted;

  try {
    const created = await prisma.asset.create({
      data: {
        id: randomUUID(),
        clientId,
        followUpOf: original.id,
        followUpFormat: format,
        title: original.title,
        slug: await freeSlug(`${original.slug}-${FOLLOW_UP_LABEL[format]}`),
        hook: original.hook,
        coreArgument: original.coreArgument,
        content: original.content,
        audience: original.audience,
        pillar: original.pillar,
        targetTrade: original.targetTrade,
        status: "PENDING_REVIEW",
        claimsOk: original.claimsOk,
        coverSpec: original.coverSpec ?? Prisma.DbNull,
        heroImageUrl: original.heroImageUrl,
        heroStatus: original.heroStatus,
        heroProvider: original.heroProvider,
        carouselSpec:
          format === "CAROUSEL" && carousel
            ? ({ ...carousel, active: true, caption: text, ...(carousel.plan ? { plan: { ...carousel.plan, caption: text } } : {}) } as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
        linkedinVariant: format === "COVER" ? text : original.linkedinVariant,
        facebookVariant: original.facebookVariant,
        xVariant: original.xVariant,
        channels: ["linkedin"],
        generationCost: costUsd,
      },
      select: { id: true },
    });
    return done(created.id, true);
  } catch (e) {
    // Two clicks at once: the second post already exists.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const row = await prisma.asset.findUnique({ where: { followUpOf: original.id }, select: { id: true } });
      if (row) return done(row.id, false);
    }
    throw e;
  }
}
