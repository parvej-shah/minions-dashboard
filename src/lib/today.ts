/**
 * Pure helpers for the Today page (task 22): what to say, and this week's strip.
 * Everything is computed on the workspace's clock, not the browser's.
 */

import { utcToZoned } from "@/lib/postTime";

interface Post {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  publish_failures?: Record<string, string> | null;
  hook?: string;
  channels?: string[];
  hero_image_url?: string | null;
  variants?: unknown;
  pillar?: string;
  target_trade?: string;
  core_argument?: string;
  carousel_pages?: string[] | null;
  linkedin_went_as?: "CAROUSEL" | "COVER" | null;
  cover?: unknown;
}

export type TodayPostCardData = Post;

export type DayItem =
  | { kind: "scheduled"; time: string; title: string; id: string }
  | { kind: "posted"; time: string; title: string; id: string }
  | { kind: "slot"; time: string };

export interface WeekDay {
  key: string;
  weekday: string;
  day: number;
  isToday: boolean;
  items: DayItem[];
}

function parts(date: Date, timeZone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return { key: `${p.year}-${p.month}-${p.day}`, day: Number(p.day), weekday: p.weekday as string, hour: Number(p.hour), time: `${p.hour}:${p.minute}` };
}

export function greeting(now: Date, timeZone: string): string {
  const { hour } = parts(now, timeZone);
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Seven days from today: scheduled posts, posts that went out, and open posting slots. */
export function buildWeek(now: Date, timeZone: string, posts: Post[], slots: string[]): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    // Noon-ish steps keep DST shifts from skipping or repeating a day.
    const p = parts(new Date(now.getTime() + i * 86_400_000), timeZone);
    days.push({ key: p.key, weekday: p.weekday, day: p.day, isToday: i === 0, items: [] });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  const taken = new Set<string>();

  for (const post of posts) {
    const when = post.status === "SCHEDULED" ? post.scheduled_for : post.status === "PUBLISHED" ? post.published_at : null;
    if (!when) continue;
    const p = parts(new Date(when), timeZone);
    const day = byKey.get(p.key);
    if (!day) continue;
    day.items.push({ kind: post.status === "SCHEDULED" ? "scheduled" : "posted", time: p.time, title: post.title, id: post.id });
    taken.add(`${p.key} ${p.time}`);
  }
  for (const slot of slots) {
    const p = parts(new Date(slot), timeZone);
    const day = byKey.get(p.key);
    if (!day || taken.has(`${p.key} ${p.time}`)) continue;
    day.items.push({ kind: "slot", time: p.time });
  }
  for (const d of days) d.items.sort((x, y) => x.time.localeCompare(y.time));
  return days;
}

/** Drafts waiting for the reviewer, newest first (freshest generation spotlighted first). */
export function waitingForYou<T extends Post>(posts: T[]): T[] {
  return posts.filter((p) => p.status === "PENDING_REVIEW").sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** The single post spotlighted on Today: newest draft first, or cycled by index. */
export function spotlightPost<T extends Post>(posts: T[], index = 0): T | null {
  const waiting = waitingForYou(posts);
  if (waiting.length === 0) return null;
  if (index < 0 || index >= waiting.length) return null;
  return waiting[index] ?? null;
}

/** Milestone-focused headline for Today, replacing volume counts. */
export function todayHeadline(nextSlot: string | null, timeZone: string): string {
  if (!nextSlot) return "Your post is ready for your OK.";
  return `Your post for ${slotLabel(nextSlot, timeZone)} is ready.`;
}

/** Converts a slot ISO string to zoned { date, time } payload for 1-tap scheduling. */
export function todaySchedulePayload(slotIso: string, timeZone: string): { date: string; time: string } {
  return utcToZoned(new Date(slotIso), timeZone);
}

export function recentlyPosted<T extends Post>(posts: T[], limit: number): T[] {
  return posts
    .filter((p) => p.status === "PUBLISHED" && p.published_at)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, limit);
}

/** Posts that went out but that a channel refused (LinkedIn's token expired, say), newest first. */
export function failedPosts<T extends Post>(posts: T[]): T[] {
  return posts
    .filter((p) => p.status === "PUBLISHED" && Object.values(p.publish_failures ?? {}).some((r) => typeof r === "string" && r.trim()))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

/** "Wed 11 Nov, 09:00" on the workspace clock. */
export function slotLabel(iso: string, timeZone: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(d);
  return `${day.replace(/,/g, "")}, ${parts(d, timeZone).time}`;
}

/** "Wed 09:00" on the workspace clock - compact and fits cleanly on buttons without wrapping. */
export function compactSlotLabel(iso: string, timeZone: string): string {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" }).format(d);
  return `${weekday.replace(/,/g, "")} ${parts(d, timeZone).time}`;
}

const CHANNEL_NAME_MAP: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  blog: "Blog",
};

/** Formats channel list cleanly for executive review (e.g. LinkedIn, Instagram). */
export function postChannels(post: Post, defaultChannels: string[] = ["LinkedIn"]): string[] {
  if (post.channels && post.channels.length > 0) {
    return post.channels.map((c) => {
      const lower = c.toLowerCase();
      return CHANNEL_NAME_MAP[lower] ?? (c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
    });
  }
  return defaultChannels;
}

/** Determines post format label for executive precision (e.g. Carousel · 5 slides vs Cover poster). */
export function postFormatLabel(post: Post): string {
  if (post.carousel_pages && post.carousel_pages.length > 0) {
    return `Carousel · ${post.carousel_pages.length} slides`;
  }
  if (post.linkedin_went_as === "CAROUSEL") {
    return "Carousel";
  }
  if (post.cover || post.hero_image_url) {
    return "Cover poster";
  }
  return "Standard post";
}

/** Extracts the strategic topic / pillar for the post. */
export function postTopicSnippet(post: Post): string | null {
  if (post.pillar && post.pillar.trim()) {
    return post.pillar.trim();
  }
  if (post.target_trade && post.target_trade.trim()) {
    return post.target_trade.trim();
  }
  return null;
}

/** Extracts the core thesis / argument for fast executive assessment. */
export function postThesisSnippet(post: Post): string | null {
  if (post.core_argument && post.core_argument.trim()) {
    return post.core_argument.trim();
  }
  return null;
}

/** Finds a post scheduled for today on the workspace clock. */
export function scheduledForToday<T extends Post>(posts: T[], now: Date, timeZone: string): T | null {
  const todayKey = parts(now, timeZone).key;
  const matches = posts
    .filter((p) => p.status === "SCHEDULED" && p.scheduled_for)
    .filter((p) => parts(new Date(p.scheduled_for!), timeZone).key === todayKey)
    .sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!));
  return matches[0] ?? null;
}
