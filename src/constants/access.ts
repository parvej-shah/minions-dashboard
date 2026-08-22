/**
 * Role vocabulary only. Role/tenant *derivation* used to live here as a
 * hardcoded email whitelist + substring match (ADMIN_WHITELIST_EMAILS /
 * resolveUserRole) — that could not survive self-serve signup, since it had
 * no notion of "which tenant." It now happens in src/lib/auth.ts (reading the
 * `User` table) and is exposed to the rest of the app via src/lib/tenant.ts.
 */

export type UserRole = "OWNER" | "MARKETING_DIRECTOR" | "MEMBER" | "SYSTEM_ADMIN";
