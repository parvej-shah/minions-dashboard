import type { Session } from "next-auth";
import { isEstablishedTenant } from "@/lib/onboardingGuard";

/**
 * Where a signed-in person belongs when they arrive without a destination:
 * straight after Google sign-in, or on opening /login while already signed in.
 *
 * Decided on the server, before anything renders, so nobody sees the
 * onboarding form flash up while a client-side status check is still running,
 * and an established workspace is never asked to choose between Brand and
 * Ideas: it goes to the dashboard.
 */
export async function homeRouteFor(session: Session | null): Promise<string> {
  const user = session?.user;
  if (!user) return "/login";
  if (!user.clientId) return user.role === "SYSTEM_ADMIN" ? "/platform-admin" : "/onboarding/setup";
  return (await isEstablishedTenant(user.clientId)) ? "/" : "/onboarding/setup";
}
