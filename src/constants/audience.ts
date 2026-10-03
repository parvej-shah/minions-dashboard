/**
 * Who a brand directive applies to. One ICP per tenant (decision D14); the
 * PEER and BRIDGE lanes are retired.
 */
const AUDIENCE_SCOPES = ["ALL", "ICP"] as const;
export type AudienceScope = (typeof AUDIENCE_SCOPES)[number];

/** Values old directive rows may still carry. Read-only: never accepted on write. */
export type RetiredAudienceScope = "PEER" | "BRIDGE";

/** The scope to store, or null when a caller sent one that is not accepted. */
export function resolveAudienceScope(value: unknown): AudienceScope | null {
  if (value === undefined || value === null || value === "") return "ALL";
  const upper = String(value).toUpperCase();
  return (AUDIENCE_SCOPES as readonly string[]).includes(upper) ? (upper as AudienceScope) : null;
}

export const RETIRED_SCOPE_MESSAGE =
  "audience_scope must be ALL or ICP. Minions writes for one ICP; the PEER and BRIDGE audiences were retired.";
