import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";
import { isEstablishedTenant, ESTABLISHED_TENANT_MESSAGE } from "@/lib/onboardingGuard";

/**
 * Lets the onboarding wizard find out up front that this workspace is already
 * set up, instead of after the user has filled in every step. The write
 * routes enforce the same rule server-side.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const established = await isEstablishedTenant(ctx.clientId);
  return NextResponse.json({ established, message: established ? ESTABLISHED_TENANT_MESSAGE : null });
}
