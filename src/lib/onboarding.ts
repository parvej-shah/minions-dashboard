import { cookies } from "next/headers";

export const PENDING_SIGNUP_COOKIE = "minions_pending_signup";

/**
 * Marks that the next Google sign-in is a deliberate self-serve signup, not
 * an operator trying the whitelist-gated dashboard login. src/lib/auth.ts's
 * signIn callback checks for this cookie before it will create a new `User`
 * row for an email it has never seen — without it, any Google account could
 * silently provision itself a tenant.
 */
export async function markPendingSignup(): Promise<void> {
  const store = await cookies();
  store.set(PENDING_SIGNUP_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes: long enough for the OAuth round trip, short enough not to linger
    path: "/",
  });
}

export async function consumePendingSignup(): Promise<boolean> {
  const store = await cookies();
  const present = store.get(PENDING_SIGNUP_COOKIE)?.value === "1";
  // NextAuth v5 may call signIn multiple times during the callback phase.
  // We rely on the 10-minute maxAge to clear this instead of deleting it immediately,
  // preventing false-negative rejections if it's checked twice.
  return present;
}
