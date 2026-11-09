import { linkedinWentAs, type FollowUpFormat } from "@/lib/followUp";
import { prisma } from "@/lib/prisma";
import { ownedAssetWhere } from "@/services/assets";
import { refreshCoverIfStale } from "@/services/cover";

export type MarkPostedResult = { ok: true; published_at: string; linkedin_went_as: FollowUpFormat | null } | { ok: false; error: string; status: number };

/**
 * A reviewer who copied the post to LinkedIn by hand tells Minions it is out.
 * Nothing is sent anywhere: the draft becomes PUBLISHED with a publish time
 * and a LinkedIn time. The time matters, because the publisher's poll
 * broadcasts every PUBLISHED asset whose `publishedAt` is empty, and this one
 * must not go out a second time.
 */
export async function markPosted(clientId: string, assetId: string, now: Date = new Date()): Promise<MarkPostedResult> {
  const asset = await prisma.asset.findFirst({
    where: ownedAssetWhere(clientId, assetId),
    select: { id: true, slug: true, status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true, carouselSpec: true },
  });
  if (!asset) return { ok: false, error: "Draft not found", status: 404 };
  if (asset.status === "SCHEDULED") return { ok: false, error: "This post is scheduled. Cancel the schedule first.", status: 409 };
  if (asset.status === "PUBLISHED" || asset.publishedAt || asset.linkedinPublishedAt || asset.facebookPublishedAt) {
    return { ok: false, error: "This post is already marked as out.", status: 409 };
  }

  // The cover must match the text the reviewer copied.
  await refreshCoverIfStale(asset.id);
  const updated = await prisma.asset.updateMany({
    where: { id: asset.id, status: { not: "PUBLISHED" } },
    data: { status: "PUBLISHED", publishedAt: now, linkedinPublishedAt: now, claimsOk: "Y", updatedAt: now },
  });
  if (updated.count !== 1) return { ok: false, error: "This post was just marked as out.", status: 409 };
  return { ok: true, published_at: now.toISOString(), linkedin_went_as: linkedinWentAs({ linkedinPublishedAt: now, carouselSpec: asset.carouselSpec }) };
}
