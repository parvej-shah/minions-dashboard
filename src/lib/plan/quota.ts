/**
 * The monthly draft allowance as the Schedule card shows it (task 128). Pure.
 * dueTenants stops drafting at the limit; the card must say so rather than promise a next draft.
 */
import { formatPostTime } from "@/lib/postTime";

export interface QuotaState {
  used: number;
  limit: number;
  limit_reached: boolean;
  /** The 1st of next month, 00:00 UTC (src/services/quota.ts counts from the 1st). */
  resets_at: string;
}

export function quotaState(used: number, limit: number, now: Date = new Date()): QuotaState {
  const resets = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { used, limit, limit_reached: used >= limit, resets_at: resets.toISOString() };
}

export interface DraftingCardInput {
  exists: boolean;
  drafting_on: boolean;
  timezone: string;
  next_slot_at: string | null;
  quota: QuotaState | null;
}

export function draftingCardText(s: DraftingCardInput): { tone: "off" | "on" | "paused"; title: string; detail: string } {
  if (!s.exists) return { tone: "off", title: "Off", detail: "Set your publishing pace below, then turn this on." };
  if (!s.drafting_on) {
    return { tone: "off", title: "Off", detail: "Drafting has not started. Turn it on to have Minions draft for your pace." };
  }
  if (s.quota?.limit_reached) {
    const day = new Intl.DateTimeFormat("en-GB", { timeZone: s.timezone, day: "numeric", month: "short" }).format(new Date(s.quota.resets_at));
    return { tone: "paused", title: "Paused", detail: `Monthly limit reached (${s.quota.used} of ${s.quota.limit}). Drafting resumes ${day}.` };
  }
  const next = s.next_slot_at
    ? `Next post slot: ${formatPostTime(s.next_slot_at, s.timezone)}.`
    : "Active. Drafts are prepared automatically for your upcoming slots.";
  return { tone: "on", title: "Active", detail: next };
}
