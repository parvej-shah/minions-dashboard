import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { slideJpeg } from "@/lib/carousel/render";
import { metaGraph, type GraphCall } from "@/lib/metaGraph";
import { resolveChannelCredential } from "@/services/channels";
import { instagramDeck, instagramFormatFor, workspaceInstagramFormat } from "@/lib/carousel/instagramFormat";

/** Instagram's own limits: JPEG only, 2 to 10 carousel items (instagramDeck), 2200 caption characters. */
const MAX_CAPTION = 2200;
const STATUS_TRIES = 10;

type CoverAsset = { id: string; clientId: string; heroImageUrl: string | null };

export interface InstagramDeps {
  graph: GraphCall;
  /** A public JPEG of the post's cover (Instagram takes no PNG). */
  coverJpeg: (asset: CoverAsset) => Promise<string>;
  sleep: (ms: number) => Promise<void>;
}

export type InstagramResult = { ok: true; media_id: string } | { ok: true; skipped: string } | { ok: false; error: string };

/** The Instagram caption, or the Facebook text when a draft predates it. Links never click there, so none stay. */
export function instagramCaption(instagram: string | null | undefined, facebook: string | null | undefined): string {
  const text = instagram?.trim() ? instagram : (facebook ?? "");
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim()
    .slice(0, MAX_CAPTION);
}

async function defaultCoverJpeg(asset: CoverAsset): Promise<string> {
  if (!asset.heroImageUrl) throw new Error("The post has no cover image.");
  if (/\.jpe?g(\?|$)/i.test(asset.heroImageUrl)) return asset.heroImageUrl;
  const res = await fetch(asset.heroImageUrl, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Could not fetch the cover (${res.status}).`);
  const jpeg = await slideJpeg(Buffer.from(await res.arrayBuffer()));
  return (await uploadToR2(`covers/${asset.clientId}/${asset.id}-ig-${Date.now()}.jpg`, jpeg, "image/jpeg")).url;
}

const DEFAULTS: InstagramDeps = {
  graph: metaGraph,
  coverJpeg: defaultCoverJpeg,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** Meta fetches each image itself; a container is publishable once it reports FINISHED. */
async function waitUntilFinished(deps: InstagramDeps, containerId: string, token: string) {
  for (let i = 0; i < STATUS_TRIES; i++) {
    const { status_code } = await deps.graph(containerId, { fields: "status_code", access_token: token }, "GET");
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Instagram could not process the media (${status_code}).`);
    await deps.sleep(3000);
  }
  throw new Error("Instagram was still processing the media; try again later.");
}

/**
 * Posts an approved draft to the workspace's Instagram: its carousel when it has one,
 * otherwise its cover. Never throws, so a failure here never holds back the other channels.
 */
export async function publishToInstagram(assetId: string, overrides: Partial<InstagramDeps> = {}): Promise<InstagramResult> {
  const deps = { ...DEFAULTS, ...overrides };
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, clientId: true, instagramPostId: true, instagramVariant: true, facebookVariant: true, heroImageUrl: true, carouselSpec: true },
    });
    if (!asset?.clientId) return { ok: false, error: "Post not found." };
    if (asset.instagramPostId) return { ok: true, skipped: "already_posted" };

    const clientId = asset.clientId;
    const cred = await resolveChannelCredential(clientId, "instagram", asset.id);
    if ("post_excluded" in cred && cred.post_excluded) return { ok: true, skipped: "post_excluded" };
    if (!cred.token || !cred.external_id) return { ok: true, skipped: "not_connected" };
    if (!cred.is_active) return { ok: true, skipped: "channel_off" };

    const { token, external_id: igId } = cred;
    const caption = instagramCaption(asset.instagramVariant, asset.facebookVariant);
    // The draft's pick, else the workspace's last pick (so automated posts match), else the carousel.
    const row = await prisma.clientChannel.findUnique({ where: { clientId_channelKey: { clientId, channelKey: "instagram" } }, select: { config: true } });
    const pages = instagramFormatFor(asset.carouselSpec, workspaceInstagramFormat(row?.config)) === "CAROUSEL" ? instagramDeck(asset.carouselSpec) : [];

    let creationId: string;
    if (pages.length >= 2) {
      const children: string[] = [];
      for (const image_url of pages) {
        children.push(String((await deps.graph(`${igId}/media`, { image_url, is_carousel_item: "true", access_token: token })).id));
      }
      creationId = String((await deps.graph(`${igId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption, access_token: token })).id);
    } else {
      const image_url = await deps.coverJpeg({ ...asset, clientId });
      creationId = String((await deps.graph(`${igId}/media`, { image_url, caption, access_token: token })).id);
    }

    await waitUntilFinished(deps, creationId, token);
    const mediaId = String((await deps.graph(`${igId}/media_publish`, { creation_id: creationId, access_token: token })).id);

    await prisma.asset.update({ where: { id: asset.id }, data: { instagramPostId: mediaId, instagramPublishedAt: new Date() } });
    return { ok: true, media_id: mediaId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
