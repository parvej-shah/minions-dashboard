/**
 * Who may sign in, and what role they get.
 *
 * Role derivation lives here alone so the auth callback and the UI cannot
 * drift apart (they previously computed it independently).
 */

export type UserRole = "MARKETING_DIRECTOR" | "SYSTEM_ADMIN";

export const ADMIN_WHITELIST_EMAILS: readonly string[] = [
  "parvejshahlabib007@gmail.com",
  "xpeedlab@gmail.com",
  "xbitlab@gmail.com",
  "parvej@getminions.ai",
  "rakib@getminions.ai",
];

export function resolveUserRole(email: string | null | undefined): UserRole {
  return email?.toLowerCase().includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN";
}
