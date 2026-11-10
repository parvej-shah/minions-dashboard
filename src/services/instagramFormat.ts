import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { instagramDeck, type InstagramFormat } from "@/lib/carousel/instagramFormat";

export type InstagramFormatResult = { ok: true; format: InstagramFormat } | { ok: false; error: string; locked?: boolean };

/**
 * A reviewer's pick of Carousel or Single poster for this draft. It is also kept
 * as the workspace's default, so drafts nobody opens go out the same way.
 */
export async function setInstagramFormat(clientId: string, assetId: string, format: InstagramFormat): Promise<InstagramFormatResult> {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, clientId }, select: { id: true, carouselSpec: true, instagramPostId: true } });
  if (!asset) return { ok: false, error: "Post not found." };
  if (asset.instagramPostId) return { ok: false, error: "This post is already on Instagram, so it stays as it went out.", locked: true };
  if (!instagramDeck(asset.carouselSpec).length) return { ok: false, error: "This post has no carousel yet, so Instagram gets the single poster." };

  const spec = { ...(asset.carouselSpec as Record<string, unknown>), instagram_format: format };
  await prisma.asset.update({ where: { id: asset.id }, data: { carouselSpec: spec as Prisma.InputJsonValue } });

  const row = await prisma.clientChannel.findUnique({ where: { clientId_channelKey: { clientId, channelKey: "instagram" } }, select: { config: true } });
  const config = { ...((row?.config as Record<string, unknown> | null) ?? {}), format };
  await prisma.clientChannel.upsert({
    where: { clientId_channelKey: { clientId, channelKey: "instagram" } },
    update: { config },
    create: { clientId, channelKey: "instagram", isActive: false, config: { format } },
  });
  return { ok: true, format };
}
