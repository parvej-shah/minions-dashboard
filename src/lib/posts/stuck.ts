import { failureList } from "@/lib/publishFailures";

/** How long a released post may take to reach its channels (03 polls every 5 minutes) before it counts as not sent. */
export const STUCK_AFTER_MINUTES = 15;

interface StuckPost {
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  publish_failures?: Record<string, string> | null;
}

/**
 * Released (PUBLISHED) but with no posting time and no recorded failure, long after its release:
 * the publisher never picked it up, so it must not read "Posted" (task 127).
 * `scheduled_for` is kept as the release time, so a post never scheduled is never "stuck".
 */
export function isPostStuck(post: StuckPost, now: Date = new Date()): boolean {
  if (post.status !== "PUBLISHED" || post.published_at || !post.scheduled_for) return false;
  if (failureList(post.publish_failures).length > 0) return false;
  return now.getTime() - new Date(post.scheduled_for).getTime() > STUCK_AFTER_MINUTES * 60_000;
}
