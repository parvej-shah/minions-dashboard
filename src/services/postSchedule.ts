import { prisma } from "@/lib/prisma";
import { checkScheduleTime } from "@/lib/postTime";
import { syncAssetToBlog } from "@/services/publishing";
import { DEFAULT_TIMEZONE } from "@/constants/config";

/**
 * Scheduling one reviewed post (phase 7, the user's ask on 2026-09-25): after
 * review, a draft can go out now or at a date and time the reviewer picks.
 *
 * A scheduled draft waits as status SCHEDULED with `scheduled_for` set. Nothing
 * reaches the blog or social until it is due: `releaseDuePosts` (called at the
 * top of 03_review_publisher's 5-minute poll) turns it into an ordinary
 * PUBLISHED-but-not-yet-broadcast asset, which the same poll then publishes.
 */

export type ScheduleResult =
  | { ok: true; scheduled_for: string | null; status: string }
  | { ok: false; error: string; status: number };

async function liveOnBlog(clientId: string, asset: { id: string; slug: string }): Promise<boolean> {
  return Boolean(await prisma.blog.findFirst({ where: { clientId, OR: [{ assetId: asset.id }, { slug: asset.slug }] }, select: { slug: true } }));
}

/** Approve a draft to go out at a local date and time in the workspace's timezone. */
export async function schedulePost(clientId: string, assetId: string, date: string, time: string, now: Date = new Date()): Promise<ScheduleResult> {
  const [asset, client] = await Promise.all([
    prisma.asset.findFirst({
      where: { OR: [{ id: assetId }, { slug: assetId }], clientId },
      select: { id: true, slug: true, status: true, publishedAt: true, linkedinPublishedAt: true, facebookPublishedAt: true },
    }),
    prisma.client.findUnique({ where: { id: clientId }, select: { timezone: true } }),
  ]);
  if (!asset) return { ok: false, error: "Draft not found", status: 404 };
  if (asset.status === "PUBLISHED" || asset.publishedAt || asset.linkedinPublishedAt || asset.facebookPublishedAt || (await liveOnBlog(clientId, asset))) {
    return { ok: false, error: "This post is already out, so it can't be scheduled.", status: 409 };
  }

  const check = checkScheduleTime(date, time, client?.timezone ?? DEFAULT_TIMEZONE, now);
  if (!check.ok) return { ok: false, error: check.error, status: 400 };

  // Scheduling is the reviewer's approval, exactly as "Approve & Publish" is.
  const updated = await prisma.asset.updateMany({
    where: { id: asset.id, status: { not: "PUBLISHED" } },
    data: { status: "SCHEDULED", scheduledFor: check.at, claimsOk: "Y", updatedAt: now },
  });
  if (updated.count !== 1) return { ok: false, error: "This post just went out, so it can't be scheduled.", status: 409 };
  return { ok: true, scheduled_for: check.at.toISOString(), status: "SCHEDULED" };
}

/** Take a scheduled post back to review. It goes nowhere until approved again. */
export async function unschedulePost(clientId: string, assetId: string, now: Date = new Date()): Promise<ScheduleResult> {
  const asset = await prisma.asset.findFirst({ where: { OR: [{ id: assetId }, { slug: assetId }], clientId }, select: { id: true } });
  if (!asset) return { ok: false, error: "Draft not found", status: 404 };
  const updated = await prisma.asset.updateMany({
    where: { id: asset.id, status: "SCHEDULED" },
    data: { status: "PENDING_REVIEW", scheduledFor: null, updatedAt: now },
  });
  if (updated.count !== 1) return { ok: false, error: "This post is no longer scheduled: it may have just gone out.", status: 409 };
  return { ok: true, scheduled_for: null, status: "PENDING_REVIEW" };
}

/**
 * Every scheduled post that is due becomes PUBLISHED (not yet broadcast) and is
 * put on the blog, exactly as "Approve & Publish" does, so the publisher's poll
 * picks it up. The status flip is a compare-and-set, so two overlapping polls
 * release a post once. `scheduled_for` is kept as the record of the plan.
 */
export async function releaseDuePosts(now: Date = new Date(), limit = 20): Promise<string[]> {
  const due = await prisma.asset.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    select: { id: true },
  });

  const released: string[] = [];
  for (const { id } of due) {
    const flipped = await prisma.asset.updateMany({
      where: { id, status: "SCHEDULED" },
      data: { status: "PUBLISHED", publishedAt: null, updatedAt: now },
    });
    if (flipped.count !== 1) continue;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (asset) await syncAssetToBlog(asset, "PUBLISHED", {});
    released.push(id);
  }
  return released;
}
