/** Which platforms refused a post that otherwise went out (assets.publish_failures: { channel: reason }). */
const LABELS = { linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram" } as const;
const ORDER = ["linkedin", "facebook", "instagram"] as const;

export type FailureChannel = (typeof ORDER)[number];
export type PublishFailures = Partial<Record<FailureChannel, string>>;
export interface Failure { channel: FailureChannel; label: string; reason: string }

export function failureList(raw: unknown): Failure[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const map = raw as Record<string, unknown>;
  return ORDER.flatMap((channel) => {
    const reason = map[channel];
    return typeof reason === "string" && reason.trim() ? [{ channel, label: LABELS[channel], reason: reason.trim() }] : [];
  });
}

/** "LinkedIn failed", "LinkedIn and Instagram failed"; null when nothing failed. */
export function failureSummary(raw: unknown): string | null {
  const names = failureList(raw).map((f) => f.label);
  if (names.length === 0) return null;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return `${list} failed`;
}
