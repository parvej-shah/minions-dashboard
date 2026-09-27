import type { Asset } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOG_AUTHOR_AVATAR } from "@/constants/config";
import { postGoesTo } from "@/constants/postChannels";

/** The workspace whose posts are getminions.ai's own. */
export const TENANT_ZERO_ID = "tenant-zero-getminions-ai";

/** Founders the getminions.ai byline is drawn from. */
const FOUNDER_NAMES = ["Parvej", "Rakib"] as const;

/**
 * The byline stored on a blog row. Only getminions.ai's own posts carry a
 * Minions founder; every other workspace's posts are credited to that brand.
 * Every customer's published post used to be signed "Co-Founder, Minions.AI".
 */
export async function buildAuthor(clientId: string | null) {
  if (clientId === TENANT_ZERO_ID) {
    return {
      name: FOUNDER_NAMES[Math.floor(Math.random() * FOUNDER_NAMES.length)],
      role: "Co-Founder, Minions.AI",
      avatar: BLOG_AUTHOR_AVATAR,
    };
  }
  const brand = clientId
    ? await prisma.brandProfile.findUnique({ where: { clientId }, select: { brandName: true, primaryLogoUrl: true } })
    : null;
  return {
    name: `${brand?.brandName || "Editorial"} Team`,
    role: "Editorial Team",
    avatar: brand?.primaryLogoUrl || "",
  };
}

/**
 * Removes an asset from the public blogs table, leaving the asset row intact.
 * Scoped to the asset's workspace: matching on slug alone could delete another
 * workspace's post.
 */
export async function removeFromBlog(assetId: string, slug: string, clientId: string | null): Promise<void> {
  await prisma.blog.deleteMany({ where: { clientId, OR: [{ assetId }, { slug }] } });
}

/**
 * Upserts an asset into the public blogs table.
 *
 * This is the dominant publish path: n8n's own direct blogs-table write only
 * fires when claims_ok === 'Y' at draft time, which most drafts never hit — so
 * the founder byline has to be assigned here too, not just in n8n.
 */
export async function upsertToBlog(asset: Asset): Promise<void> {
  // One asset must map to exactly one blog row. Keying the upsert on the slug
  // alone created a second live post whenever a retitled asset was published
  // again, so an existing row for this asset is rebound to the new slug.
  const existingForAsset = await prisma.blog.findFirst({ where: { assetId: asset.id } });

  if (existingForAsset && existingForAsset.slug !== asset.slug) {
    await prisma.blog.update({
      where: { slug: existingForAsset.slug },
      data: {
        slug: asset.slug,
        title: asset.title,
        hook: asset.hook,
        coreArgument: asset.coreArgument,
        content: asset.content,
        audience: asset.audience,
        pillar: asset.pillar,
        docUrl: asset.docUrl,
        publishedAt: asset.publishedAt || new Date(),
        updatedAt: new Date(),
      },
    });
    return;
  }

  // `slug` is the blogs primary key across ALL workspaces. Never let one
  // workspace's publish overwrite another's row that happens to share it.
  const owner = await prisma.blog.findUnique({ where: { slug: asset.slug }, select: { clientId: true } });
  if (owner && owner.clientId !== asset.clientId) {
    throw new Error(`Blog slug "${asset.slug}" belongs to another workspace; refusing to overwrite it.`);
  }

  await prisma.blog.upsert({
    where: { slug: asset.slug },
    create: {
      slug: asset.slug,
      clientId: asset.clientId,
      title: asset.title,
      hook: asset.hook,
      coreArgument: asset.coreArgument,
      content: asset.content,
      audience: asset.audience,
      pillar: asset.pillar,
      author: await buildAuthor(asset.clientId),
      assetId: asset.id,
      docUrl: asset.docUrl,
      publishedAt: asset.publishedAt || new Date(),
    },
    update: {
      title: asset.title,
      hook: asset.hook,
      coreArgument: asset.coreArgument,
      content: asset.content,
      audience: asset.audience,
      pillar: asset.pillar,
      // The byline is deliberately absent here: it is assigned once on create.
      // Re-running a publish used to reroll `buildAuthor()`, so a live post
      // could change its author between one republish and the next.
      assetId: asset.id,
      publishedAt: asset.publishedAt || new Date(),
      updatedAt: new Date(),
    },
  });
}

/** Fields a non-status edit propagates to an already-published blog row. */
export interface BlogEditFields {
  title?: string;
  content?: string;
  hook?: string;
  coreArgument?: string;
}

/** Propagates a content edit to the live blog row, if one exists. */
export async function syncBlogEdit(
  assetId: string,
  slug: string,
  clientId: string | null,
  fields: BlogEditFields
): Promise<void> {
  const existing = await prisma.blog.findFirst({
    where: { clientId, OR: [{ assetId }, { slug }] },
  });
  if (!existing) return;

  await prisma.blog.update({
    where: { slug: existing.slug },
    data: { ...fields, updatedAt: new Date() },
  });
}

/**
 * Keeps the public blogs table in step with an asset's new status.
 * Sync failures are logged and swallowed: the asset write already succeeded and
 * must not be reported as failed because the mirror lagged.
 */
export async function syncAssetToBlog(
  asset: Asset,
  status: string | undefined,
  edits: BlogEditFields
): Promise<void> {
  try {
    const effectiveStatus = status ?? asset.status;

    if (effectiveStatus === "UNPUBLISHED") {
      await removeFromBlog(asset.id, asset.slug, asset.clientId);
    } else if (effectiveStatus === "PUBLISHED") {
      // A post kept off the blog (D18) is never written to it.
      if (postGoesTo(asset.channels, "blog")) await upsertToBlog(asset);
    } else if (Object.keys(edits).length > 0) {
      await syncBlogEdit(asset.id, asset.slug, asset.clientId, edits);
    }
  } catch (error) {
    console.warn("[publishing] Non-fatal: could not sync asset to blogs table:", error);
  }
}

/**
 * Releases an idea so it can be drafted again, after its asset is permanently deleted.
 */
export async function releaseIdeaForRedraft(ideaId: string): Promise<void> {
  await prisma.idea.updateMany({
    where: { id: ideaId },
    data: {
      status: "REFINED",
      draftAssetId: null,
      claimedByRunId: null,
      claimedAt: null,
    },
  });
}
