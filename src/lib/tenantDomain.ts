import { prisma } from "@/lib/prisma";

/**
 * The public blog domain for one tenant, or null if it has not set one.
 *
 * Every public post URL the dashboard renders (Live on Blog, the published feed,
 * the LinkedIn first-comment backlink) is built from this, so a tenant's links never
 * advertise another brand's domain. Returning null rather than a fallback keeps
 * that decision explicit at the call site.
 */
export async function getTenantBlogDomain(clientId: string): Promise<string | null> {
  const profile = await prisma.brandProfile
    .findUnique({ where: { clientId }, select: { companyDomain: true } })
    .catch(() => null);

  return profile?.companyDomain?.trim() || null;
}
