import { prisma } from "@/lib/prisma";
import { resolveChannelCredential } from "@/services/channels";
import { withFailure } from "@/lib/publishFailures";

type Http = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: BodyInit | null }) => Promise<Response>;
export interface LinkedInDeps { http: Http }
export type LinkedInResult = { ok: true; post_id: string } | { ok: true; skipped: string } | { ok: false; error: string };

const API = "https://api.linkedin.com/rest";
const VERSION = "202607";

/** LinkedIn's own words, plus what to do when the connection has lapsed. */
function explain(message: string): string {
  return /expired|revoked|invalid.*token|unauthori[sz]ed/i.test(message) ? `${message}. Reconnect LinkedIn in Settings, then try again.` : message;
}

/**
 * Posts a published draft to LinkedIn again: its carousel (a PDF document) when it has one switched on,
 * else its cover. The same call n8n 03 makes, for when that run was refused. Never throws and never posts
 * twice: a draft that already has a LinkedIn post id is left alone.
 */
export async function publishToLinkedIn(assetId: string, overrides: Partial<LinkedInDeps> = {}): Promise<LinkedInResult> {
  const http: Http = overrides.http ?? ((url, init) => fetch(url, init));
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, clientId: true, status: true, title: true, linkedinPostId: true, linkedinVariant: true, heroImageUrl: true, carouselSpec: true, publishFailures: true },
    });
    if (!asset?.clientId) return { ok: false, error: "Post not found." };
    if (asset.linkedinPostId) return { ok: true, skipped: "already_posted" };

    const cred = await resolveChannelCredential(asset.clientId, "linkedin", asset.id);
    if ("post_excluded" in cred && cred.post_excluded) return { ok: true, skipped: "post_excluded" };
    if (!cred.token || !cred.external_id) return { ok: true, skipped: "not_connected" };
    if (!cred.is_active) return { ok: true, skipped: "channel_off" };

    const { token, external_id: author } = cred;
    const spec = asset.carouselSpec as { active?: boolean; pdf_url?: string; caption?: string; document_title?: string } | null;
    const carousel = spec?.active === true && spec.pdf_url ? spec : null;
    const mediaUrl = carousel ? carousel.pdf_url! : asset.heroImageUrl;
    const headers = { "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0", "LinkedIn-Version": VERSION, Authorization: `Bearer ${token}` };
    const fail = async (res: Response, what: string): Promise<never> => {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message || `${what} (${res.status}).`);
    };

    let urn: string | null = null;
    if (mediaUrl) {
      const init = await http(`${API}/${carousel ? "documents" : "images"}?action=initializeUpload`, { method: "POST", headers, body: JSON.stringify({ initializeUploadRequest: { owner: author } }) });
      if (!init.ok) await fail(init, "LinkedIn refused the upload");
      const value = ((await init.json()) as { value?: { uploadUrl?: string; image?: string; document?: string } }).value;
      const file = await http(mediaUrl);
      if (!file.ok) throw new Error(`Could not fetch the ${carousel ? "carousel" : "cover"} (${file.status}).`);
      const up = await http(value?.uploadUrl ?? "", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: Buffer.from(await file.arrayBuffer()) });
      if (!up.ok) await fail(up, "LinkedIn did not take the file");
      urn = (carousel ? value?.document : value?.image) ?? null;
    }

    const body: Record<string, unknown> = {
      author,
      commentary: carousel ? carousel.caption || asset.linkedinVariant || asset.title : asset.linkedinVariant || asset.title,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (urn) body.content = { media: carousel ? { id: urn, title: carousel.document_title || asset.title } : { id: urn, altText: asset.title } };
    const post = await http(`${API}/posts`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!post.ok) await fail(post, "LinkedIn refused the post");
    const postId = post.headers.get("x-restli-id");
    if (!postId) throw new Error("LinkedIn gave no post id.");

    await prisma.asset.update({
      where: { id: asset.id },
      data: { linkedinPostId: postId, linkedinPublishedAt: new Date(), publishFailures: withFailure(asset.publishFailures, "linkedin", null) },
    });
    return { ok: true, post_id: postId };
  } catch (err) {
    const error = explain(err instanceof Error ? err.message : String(err));
    try {
      const row = await prisma.asset.findUnique({ where: { id: assetId }, select: { publishFailures: true } });
      await prisma.asset.update({ where: { id: assetId }, data: { publishFailures: withFailure(row?.publishFailures, "linkedin", error) } });
    } catch {
      /* the failure is still returned */
    }
    return { ok: false, error };
  }
}
