/**
 * Words for the Review screen's decision panel (task 24).
 */
import { POST_CHANNELS, postGoesTo } from "@/constants/postChannels";
import { slotLabel } from "@/lib/today";
import type { DistributionChannelKey } from "@/types";

const NAME: Record<(typeof POST_CHANNELS)[number], string> = { linkedin: "LinkedIn", facebook: "Facebook", blog: "your blog" };
const ORDER = ["linkedin", "facebook", "blog"] as const;

/** "LinkedIn and your blog": the channels this post goes to. Null while the switches load. */
export function whereText(override: string[] | null | undefined, workspace: Record<DistributionChannelKey, boolean> | null): string | null {
  if (!workspace) return null;
  const names = ORDER.filter((c) => workspace[c] && postGoesTo(override, c)).map((c) => NAME[c]);
  if (names.length === 0) return "Nowhere yet: switch on a channel";
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function dayKey(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** A posting time in a few words: "today 21:00", "Wed 09:00", or with the date beyond a week. */
export function shortWhen(iso: string, timeZone: string, now: Date): string {
  const at = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  if (dayKey(at, timeZone) === dayKey(now, timeZone)) return `today ${time}`;
  if (at.getTime() - now.getTime() < 6 * 86_400_000) {
    return `${new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" }).format(at)} ${time}`;
  }
  return slotLabel(iso, timeZone);
}

/** The primary button: "Post today at 21:00", "Post on Wed 09:00", or with the date beyond a week. */
export function postButtonLabel(iso: string, timeZone: string, now: Date): string {
  const when = shortWhen(iso, timeZone, now);
  return when.startsWith("today ") ? `Post today at ${when.slice(6)}` : `Post on ${when}`;
}
