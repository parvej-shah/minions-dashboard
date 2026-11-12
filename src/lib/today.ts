/**
 * Pure helpers for the Today page (task 22): what to say, and this week's strip.
 * Everything is computed on the workspace's clock, not the browser's.
 */

interface Post {
  id: string;
  title: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  publish_failures?: Record<string, string> | null;
}

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

/** Drafts waiting for the reviewer, oldest first (the one Minions would post first). */
export function waitingForYou<T extends Post>(posts: T[]): T[] {
  return posts.filter((p) => p.status === "PENDING_REVIEW").sort((a, b) => a.created_at.localeCompare(b.created_at));
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
