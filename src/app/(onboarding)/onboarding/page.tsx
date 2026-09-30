import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeRouteFor } from "@/lib/homeRoute";

/**
 * Google sign-in lands here. The destination is decided on the server, so the
 * browser goes straight to the dashboard (or the wizard, for a new workspace)
 * without rendering anything in between.
 */
export default async function OnboardingLanding() {
  redirect(await homeRouteFor(await auth()));
}
