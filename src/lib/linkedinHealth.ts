/**
 * Is a workspace's LinkedIn connection working (task 109)? Pure: the service in
 * src/services/linkedinHealth.ts reads the row and runs the cheap check.
 *
 * - missing: never connected, or disconnected
 * - expired: the token's recorded expiry passed, or LinkedIn refused it
 * - expiring: fewer than 7 days left
 * - connected: working, or expiry unknown and not refused
 */
export type LinkedInHealth = "connected" | "expiring" | "expired" | "missing";

export const EXPIRING_DAYS = 7;
/** LinkedIn member tokens last 60 days when the exchange does not say. */
export const DEFAULT_TOKEN_DAYS = 60;
/** The cheap live check runs at most this often per workspace. */
export const CHECK_EVERY_HOURS = 24;

export interface LinkedInChannelRow {
  isActive: boolean;
  credentialRef: string | null;
  config: unknown;
}

export interface LinkedInConfig {
  expiresAt?: string;
  /** Set when LinkedIn refused the token; cleared on a good check or a new connection. */
  rejectedAt?: string;
  checkedAt?: string;
}

export function linkedinConfig(row: Pick<LinkedInChannelRow, "config"> | null): LinkedInConfig {
  const c = row?.config;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as LinkedInConfig) : {};
}

export function linkedinHealth(row: LinkedInChannelRow | null, now: Date = new Date()): LinkedInHealth {
  if (!row || !row.isActive || !row.credentialRef) return "missing";
  const config = linkedinConfig(row);
  if (config.rejectedAt) return "expired";
  const expires = config.expiresAt ? Date.parse(config.expiresAt) : NaN;
  if (Number.isNaN(expires)) return "connected";
  if (expires <= now.getTime()) return "expired";
  return expires - now.getTime() < EXPIRING_DAYS * 86_400_000 ? "expiring" : "connected";
}

/** Autopilot posts to LinkedIn on its own, so it needs a working connection. */
export const autopilotAllowed = (health: LinkedInHealth) => health === "connected" || health === "expiring";

export const AUTOPILOT_NEEDS_LINKEDIN = "Connect LinkedIn first. Autopilot posts for you, so it needs a working LinkedIn connection.";

/** The one line Today shows, or null when nothing is needed. */
export function linkedinNudge(health: LinkedInHealth): { text: string; action: string } | null {
  if (health === "missing") return { text: "LinkedIn isn't connected, so posts stay on your blog.", action: "Connect LinkedIn" };
  if (health === "expired") return { text: "LinkedIn needs you to sign in again.", action: "Reconnect LinkedIn" };
  if (health === "expiring") return { text: "Your LinkedIn connection ends soon.", action: "Reconnect LinkedIn" };
  return null;
}

export function checkIsDue(row: LinkedInChannelRow | null, now: Date): boolean {
  if (!row || !row.isActive || !row.credentialRef) return false;
  const at = linkedinConfig(row).checkedAt ? Date.parse(linkedinConfig(row).checkedAt!) : NaN;
  return Number.isNaN(at) || now.getTime() - at >= CHECK_EVERY_HOURS * 3_600_000;
}

/** The banner on Today (task 120): only when a bad connection is costing posts. */
export function linkedinBanner(
  health: LinkedInHealth,
  at: { scheduled: number; waiting: number },
): { text: string; action: string } | null {
  if (health === "connected" || at.scheduled + at.waiting === 0) return null;
  const action = health === "missing" ? "Connect LinkedIn" : "Reconnect LinkedIn";
  if (at.scheduled === 0) return { text: "Connect LinkedIn so your posts can go out.", action };
  const posts = at.scheduled === 1 ? "1 scheduled post" : `${at.scheduled} scheduled posts`;
  if (health === "expiring") return { text: "Your LinkedIn connection ends soon. Reconnect so scheduled posts keep going out.", action };
  return { text: `${posts} won't go out until LinkedIn is ${health === "missing" ? "connected" : "reconnected"}.`, action };
}
