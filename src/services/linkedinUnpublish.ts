import { deleteLinkedInPost } from "@/lib/linkedin";
import { toAssetDTO } from "@/lib/mappers/asset";
import { prisma } from "@/lib/prisma";
import { getTenantBlogDomain } from "@/lib/tenantDomain";
import { ownedAssetWhere } from "@/services/assets";
import { readChannelToken } from "@/services/channels";
import { removeFromBlog } from "@/services/publishing";

type Deps = { deletePost?: typeof deleteLinkedInPost; now?: Date };
export type UnpublishLinkedInResult =
  | { ok: true; asset: ReturnType<typeof toAssetDTO> }
  | { ok: false; error: string; status: number };

const fail = (status: number, error: string): UnpublishLinkedInResult => ({ ok: false, status, error });

/**
 * Takes a published post down everywhere Minions put it: deletes the LinkedIn
 * post with the workspace's own token, removes the blog copy, and sends the
 * draft back to review with its content kept. LinkedIn goes first, so a
 * refusal there leaves Minions exactly as it was.
 */
export async function unpublishFromLinkedIn(
  clientId: string,
  idOrSlug: string,
  { deletePost = deleteLinkedInPost, now = new Date() }: Deps = {}
): Promise<UnpublishLinkedInResult> {
  const asset = await prisma.asset.findFirst({
    where: ownedAssetWhere(clientId, idOrSlug),
    select: { id: true, slug: true, clientId: true, status: true, linkedinPostId: true, facebookPostId: true },
  });
  if (!asset) return fail(404, "Post not found");
  if (asset.status !== "PUBLISHED") return fail(409, "This post isn't published.");
  if (!asset.linkedinPostId) {
    return fail(409, "Minions didn't post this to LinkedIn itself, so it can't delete it. Delete it on LinkedIn.");
  }
  // Back in review, approving it again would post to Facebook a second time.
  if (asset.facebookPostId) return fail(409, "This post also went to Facebook, so it can't be unpublished from here.");

  const channel = await prisma.clientChannel.findUnique({
    where: { clientId_channelKey: { clientId, channelKey: "linkedin" } },
    select: { credentialRef: true },
  });
  const token = channel?.credentialRef ? await readChannelToken(channel.credentialRef).catch(() => null) : null;
  if (!token) return fail(409, "LinkedIn isn't connected. Reconnect LinkedIn, then try again.");

  const deleted = await deletePost(token, asset.linkedinPostId);
  if (!deleted.ok) {
    // 409, not 401: apiClient treats any 401 as this app's own session expiring.
    if (deleted.status === 401) return fail(409, "Your LinkedIn connection has expired. Reconnect LinkedIn, then try again.");
    if (deleted.status === 403) return fail(409, "LinkedIn refused. The connected account may not be the one that posted it.");
    return fail(502, "LinkedIn couldn't delete the post right now. Try again in a minute.");
  }

  await removeFromBlog(asset.id, asset.slug, asset.clientId).catch((error) =>
    console.warn("[linkedinUnpublish] Could not remove the blog copy:", error)
  );
  // Never PUBLISHED with an empty publishedAt: the publisher's poll would send it again.
  await prisma.asset.updateMany({
    where: { id: asset.id, status: "PUBLISHED" },
    data: {
      status: "PENDING_REVIEW",
      publishedAt: null,
      publishedUrls: null,
      linkedinPostId: null,
      linkedinPublishedAt: null,
      scheduledFor: null,
      updatedAt: now,
    },
  });
  const reverted = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id }, include: { claims: true } });
  return { ok: true, asset: toAssetDTO(reverted, null, await getTenantBlogDomain(clientId)) };
}
