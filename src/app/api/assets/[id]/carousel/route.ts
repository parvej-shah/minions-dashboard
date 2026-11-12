import { NextResponse } from "next/server";
import { parsePlan } from "@/lib/carousel/plan";
import { SLIDE_STYLES, type SlideStyle } from "@/lib/carousel/slides";
import { requireOwnedAssetId } from "@/services/assets";
import { carouselState, editCarousel, generateCarousel, setCarouselActive, type CarouselResult } from "@/services/carousel";
import { readJsonOrEmpty } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";
import { route } from "@/server/http/route";
import { isInstagramFormat } from "@/lib/carousel/instagramFormat";
import { setInstagramFormat } from "@/services/instagramFormat";

export const maxDuration = 300;

type Params = { id: string };

function reply(result: CarouselResult) {
  if (result.ok) return { success: true, carousel: result.carousel };
  const body = { success: false, error: result.error, errors: result.errors };
  return NextResponse.json(body, { status: result.locked ? 409 : 422 });
}

export const GET = route<"tenant", Params>({ auth: "tenant", failure: "Failed to load the carousel" }, async ({ clientId, params }) => {
  const state = await carouselState(await requireOwnedAssetId(clientId, params.id));
  if ("error" in state) throw notFound(state.error);
  return { success: true, ...state };
});

// Optional { style }: the reviewer's choice of design; without it the writer picks.
export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Failed to make the carousel" }, async ({ clientId, params, request }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const { style } = await readJsonOrEmpty(request);
  if (style !== undefined && style !== null && style !== "" && !SLIDE_STYLES.includes(style as SlideStyle)) throw badRequest(`style must be one of ${SLIDE_STYLES.join(", ")}.`);
  return reply(await generateCarousel(assetId, { style: style ? (style as SlideStyle) : undefined }));
});

// { active: boolean } switches LinkedIn between carousel and cover; { instagram: "CAROUSEL" | "SINGLE" }
// picks what Instagram gets (and becomes the workspace's default); { plan } is an edit in the model's JSON shape.
export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update the carousel" }, async ({ clientId, params, request }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const body = await readJsonOrEmpty(request);
  if (typeof body.active === "boolean") {
    if (body.instagram !== undefined) {
      if (!isInstagramFormat(body.instagram)) throw badRequest('instagram must be "CAROUSEL" or "SINGLE".');
      const picked = await setInstagramFormat(clientId, assetId, body.instagram);
      if (!picked.ok) return NextResponse.json({ success: false, error: picked.error }, { status: picked.locked ? 409 : 422 });
    }
    return reply(await setCarouselActive(assetId, body.active));
  }
  if (body.instagram !== undefined) {
    if (!isInstagramFormat(body.instagram)) throw badRequest('instagram must be "CAROUSEL" or "SINGLE".');
    const picked = await setInstagramFormat(clientId, assetId, body.instagram);
    if (picked.ok) return { success: true, instagram_format: picked.format };
    return NextResponse.json({ success: false, error: picked.error }, { status: picked.locked ? 409 : 422 });
  }
  if (body.plan && typeof body.plan === "object") {
    const parsed = parsePlan(JSON.stringify(body.plan));
    if (!parsed.plan || parsed.errors.length) {
      return NextResponse.json({ success: false, error: "The edit could not be read.", errors: parsed.errors }, { status: 400 });
    }
    return reply(await editCarousel(assetId, parsed.plan));
  }
  throw badRequest("Send { active } or { plan }");
});
