/**
 * The Posts library (task 23): one place for every post, in four plain views.
 */
import { slotLabel } from "@/lib/today";
import { failureSummary } from "@/lib/publishFailures";
import { isPostStuck } from "@/lib/posts/stuck";
import type { StatusTone as Tone } from "@/components/ui/Text";

export type { Tone };
export { isPostStuck };

export type PostGroup = "needs" | "failed" | "scheduled" | "posted" | "other";
export type PostShow = "all" | "needs" | "scheduled" | "posted" | "failed";

interface Post {
  id: string;
  status: string;
  created_at: string;
  scheduled_for: string | null;
  published_at: string | null;
  publish_failures?: Record<string, string> | null;
}

export function isPostFailed(post: Post): boolean {
  if (post.status === "FAILED") return true;
  const failures = post.publish_failures;
  if (!failures || typeof failures !== "object") return false;
  return Object.values(failures).some((r) => typeof r === "string" && r.trim().length > 0);
}

export function groupOf(postOrStatus: string | Post, now: Date = new Date()): PostGroup {
  if (typeof postOrStatus !== "string") {
    if (isPostFailed(postOrStatus) || isPostStuck(postOrStatus, now)) return "failed";
    return groupOf(postOrStatus.status);
  }
  switch (postOrStatus) {
    case "FAILED":
      return "failed";
    case "PENDING_REVIEW":
    case "BLOCKED":
      return "needs";
    case "SCHEDULED":
    case "APPROVED":
      return "scheduled";
    case "PUBLISHED":
      return "posted";
    default:
      return "other";
  }
}

const RANK: Record<PostGroup, number> = { needs: 0, failed: 1, scheduled: 2, posted: 3, other: 4 };

function compare(a: Post, b: Post): number {
  const ga = groupOf(a);
  const gb = groupOf(b);
  if (ga !== gb) return RANK[ga] - RANK[gb];
  if (ga === "needs" || ga === "failed") return b.created_at.localeCompare(a.created_at);
  if (ga === "scheduled") return (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? "");
  return (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at);
}

export function splitCuratedAndReserve<T>(posts: T[], count = 3): { curated: T[]; reserve: T[] } {
  return {
    curated: posts.slice(0, count),
    reserve: posts.slice(count),
  };
}

export function sortReservePosts<T extends Post>(posts: T[], order: "newest" | "oldest"): T[] {
  return [...posts].sort((a, b) =>
    order === "newest"
      ? b.created_at.localeCompare(a.created_at)
      : a.created_at.localeCompare(b.created_at)
  );
}

export function postsFor<T extends Post>(posts: T[], show: PostShow): T[] {
  const list = show === "all" ? posts : posts.filter((p) => groupOf(p) === show);
  return [...list].sort(compare);
}

export function defaultShow(posts: Post[]): PostShow {
  return posts.some((p) => groupOf(p) === "needs") ? "needs" : "all";
}

export function countFor(posts: Post[], show: PostShow): number {
  return show === "all" ? posts.length : posts.filter((p) => groupOf(p) === show).length;
}

export function visiblePostShows(failedCount: number): PostShow[] {
  if (failedCount > 0) {
    return ["all", "needs", "scheduled", "posted", "failed"];
  }
  return ["all", "needs", "scheduled", "posted"];
}

export function resolveEffectiveShow(show: PostShow, failedCount: number, defaultFallback: PostShow): PostShow {
  if (show === "failed" && failedCount === 0) {
    return defaultFallback;
  }
  return show;
}


export function statusLine(post: Post, timeZone: string, now: Date = new Date()): { text: string; tone: Tone } {
  const day = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)).replace(/,/g, "");

  if (isPostFailed(post)) {
    const failed = failureSummary(post.publish_failures);
    if (post.status === "PUBLISHED" && failed) {
      return { text: `Partly posted · ${failed}`, tone: "coral" };
    }
    return { text: failed ?? "Failed to post", tone: "coral" };
  }

  if (isPostStuck(post, now)) return { text: "Not posted · it did not reach your channels", tone: "coral" };
  if (post.status === "PUBLISHED" && !post.published_at && post.scheduled_for) return { text: "Going out", tone: "brand" };

  switch (post.status) {
    case "PENDING_REVIEW":
      return { text: "Needs you", tone: "coral" };
    case "BLOCKED":
      return { text: "Needs a fix", tone: "coral" };
    case "SCHEDULED":
      return { text: post.scheduled_for ? `Scheduled · ${slotLabel(post.scheduled_for, timeZone)}` : "Scheduled", tone: "success" };
    case "APPROVED":
      return { text: "Approved, going out", tone: "success" };
    case "PUBLISHED": {
      return { text: post.published_at ? `Posted · ${day(post.published_at)}` : "Posted", tone: "muted" };
    }
    case "UNPUBLISHED":
      return { text: "Taken down", tone: "muted" };
    case "REJECTED":
      return { text: "Skipped", tone: "muted" };
    default:
      return { text: "Being written", tone: "brand" };
  }
}
