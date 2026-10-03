import { markPendingSignup } from "@/lib/onboarding";
import { route } from "@/server/http/route";

// Runs right before Google sign-in, so the caller has no session yet.
export const POST = route({ auth: "public", failure: "Failed to start sign-up" }, async () => {
  await markPendingSignup();
  return { ok: true };
});
