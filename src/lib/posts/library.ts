/**
 * The Posts library (task 23): one place for every post, in four plain views.
 */
import { slotLabel } from "@/lib/today";
import type { StatusTone as Tone } from "@/components/ui/Text";

export type { Tone };

export type PostGroup = "needs" | "scheduled" | "posted" | "other";
export type PostShow = "all" | "needs" | "scheduled" | "posted";

interface Post {
  id: string;
  status: string;
  created_at: string;
  scheduled_for: string | null;
  published_at: string | null;
}

export function groupOf(status: string): PostGroup {
  switch (status) {
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

const RANK: Record<PostGroup, number> = { needs: 0, scheduled: 1, posted: 2, other: 3 };

function compare(a: Post, b: Post): number {
  const ga = groupOf(a.status);
  const gb = groupOf(b.status);
  if (ga !== gb) return RANK[ga] - RANK[gb];
  if (ga === "needs") return a.created_at.localeCompare(b.created_at);
  if (ga === "scheduled") return (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? "");
  return (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at);
}

export function postsFor<T extends Post>(posts: T[], show: PostShow): T[] {
  const list = show === "all" ? posts : posts.filter((p) => groupOf(p.status) === show);
  return [...list].sort(compare);
}

export function defaultShow(posts: Post[]): PostShow {
  return posts.some((p) => groupOf(p.status) === "needs") ? "needs" : "all";
}

export function countFor(posts: Post[], show: PostShow): number {
  return show === "all" ? posts.length : posts.filter((p) => groupOf(p.status) === show).length;
}


export function statusLine(post: Post, timeZone: string): { text: string; tone: Tone } {
  const day = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)).replace(/,/g, "");
  switch (post.status) {
    case "PENDING_REVIEW":
      return { text: "Needs you", tone: "coral" };
    case "BLOCKED":
      return { text: "Needs a fix", tone: "coral" };
    case "SCHEDULED":
      return { text: post.scheduled_for ? `Scheduled · ${slotLabel(post.scheduled_for, timeZone)}` : "Scheduled", tone: "success" };
    case "APPROVED":
      return { text: "Approved, going out", tone: "success" };
    case "PUBLISHED":
      return { text: post.published_at ? `Posted · ${day(post.published_at)}` : "Posted", tone: "muted" };
    case "UNPUBLISHED":
      return { text: "Taken down", tone: "muted" };
    case "REJECTED":
      return { text: "Skipped", tone: "muted" };
    default:
      return { text: "Being written", tone: "brand" };
  }
}
