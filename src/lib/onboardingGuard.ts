import { prisma } from "@/lib/prisma";
import { apiFailure } from "@/lib/api-response";

/**
 * Onboarding rewrites a tenant's brand wholesale: positioning, tone, proof
 * claims, logo, directives, tone examples and posting schedule. That is right
 * for a brand-new workspace and destructive for an established one.
 *
 * On 2026-08-29 two onboarding test runs made while signed in as tenant zero
 * replaced getminions.ai's own brand with a test HVAC contractor's and a
 * "Studio Lumiere"'s, wiped its verified proof claims, and swapped its logo
 * for a LinkedIn photo -- and every draft after that was written from the
 * wrong brand, with nothing flagging it.
 *
 * A tenant counts as established once it has ideas, assets, or a posting
 * schedule. Completing onboarding triggers the first harvest and creates the
 * schedule, so a workspace mid-way through its FIRST onboarding has none of
 * these and can still go back and re-submit a step freely.
 */
export async function isEstablishedTenant(clientId: string): Promise<boolean> {
  const [idea, asset, schedule] = await Promise.all([
    prisma.idea.findFirst({ where: { clientId }, select: { id: true } }),
    prisma.asset.findFirst({ where: { clientId }, select: { id: true } }),
    prisma.postingSchedule.findFirst({ where: { clientId }, select: { id: true } }),
  ]);
  return Boolean(idea || asset || schedule);
}

export const ESTABLISHED_TENANT_MESSAGE =
  "This workspace is already set up. Running onboarding again would overwrite its brand, so change it in Brand settings instead.";

/** A 409 for an onboarding write against an established tenant, or null to proceed. */
export async function refuseOnboardingOverwrite(clientId: string) {
  return (await isEstablishedTenant(clientId)) ? apiFailure(ESTABLISHED_TENANT_MESSAGE, 409) : null;
}
