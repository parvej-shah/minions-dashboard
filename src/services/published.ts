import { prisma } from "@/lib/prisma";
import { toPublishedDTO } from "@/lib/mappers/published";
import { getTenantBlogDomain } from "@/lib/tenantDomain";

export async function listPublished(clientId: string) {
  const [assets, blogs, domain] = await Promise.all([
    prisma.asset.findMany({ where: { clientId } }),
    prisma.blog.findMany({ where: { clientId }, orderBy: { publishedAt: "desc" } }),
    getTenantBlogDomain(clientId),
  ]);

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const assetsBySlug = new Map(assets.map((asset) => [asset.slug, asset]));

  return blogs.map((blog, index) =>
    toPublishedDTO(blog, (blog.assetId ? assetsById.get(blog.assetId) : undefined) ?? assetsBySlug.get(blog.slug), index, domain)
  );
}
