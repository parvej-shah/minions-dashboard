import { signIn } from "next-auth/react";
import { apiClient } from "@/lib/api-client";

/**
 * The sign-in page is also free-trial signup. The pending-signup mark must be
 * set before leaving for Google, or the signIn callback refuses a new account.
 */
export async function signInWithGoogle(callbackUrl: string): Promise<void> {
  await apiClient.post("/api/onboarding/begin");
  await signIn("google", { callbackUrl });
}
