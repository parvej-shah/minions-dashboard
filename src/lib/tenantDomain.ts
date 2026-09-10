import { prisma } from "@/lib/prisma";

/**
 * The public blog domain for one tenant, or null if it has not set one.
 *
 * Every public post URL the dashboard renders -- "Live on Blog", the
 * published feed, and the LinkedIn first-comment backlink -- must be built
 * from this. They were previously built from the hardcoded BLOG_BASE_URL, so
 * every tenant's links advertised getminions.ai regardless of who owned the
 * post. Returning null (rather than the fallback) keeps the decision to fall
 * back explicit at the call site.
 */
export async function getTenantBlogDomain(clientId: string): Promise<string | null> {
  const profile = await prisma.brandProfile
    .findUnique({ where: { clientId }, select: { companyDomain: true } })
    .catch(() => null);

  return profile?.companyDomain?.trim() || null;
}
