import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { parsePlan } from "@/lib/carousel/plan";
import { carouselState, editCarousel, generateCarousel, setCarouselActive, type CarouselResult } from "@/services/carousel";

// Generating is one model call, and a retry when the first plan fails its checks.
export const maxDuration = 300;

async function owned(id: string) {
  const ctx = await requireClientId();
  if ("error" in ctx) return { error: ctx.error };
  const asset = await prisma.asset.findFirst({ where: { OR: [{ id }, { slug: id }], clientId: ctx.clientId }, select: { id: true } });
  if (!asset) return { error: apiFailure("Asset not found", 404) };
  return { assetId: asset.id };
}

function reply(result: CarouselResult) {
  if (result.ok) return NextResponse.json({ success: true, carousel: result.carousel });
  return NextResponse.json({ success: false, error: result.error, errors: result.errors }, { status: result.locked ? 409 : 422 });
}

/** The draft's carousel, whether one is suggested for it, and whether it can still change. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const o = await owned((await params).id);
    if ("error" in o) return o.error;
    const state = await carouselState(o.assetId);
    if ("error" in state) return apiFailure(state.error, 404);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    return apiError(error, "Failed to load the carousel");
  }
}

/** Makes (or remakes) the carousel with the model, and switches it on for LinkedIn. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const o = await owned((await params).id);
    if ("error" in o) return o.error;
    return reply(await generateCarousel(o.assetId));
  } catch (error) {
    return apiError(error, "Failed to make the carousel");
  }
}

/**
 * A reviewer's change, with no model call:
 *   { active: boolean }  LinkedIn gets the carousel, or the cover image
 *   { plan: {...} }      edited slide copy, caption or title, in the model's JSON shape; checked and redrawn
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const o = await owned((await params).id);
    if ("error" in o) return o.error;
    const body = await request.json().catch(() => ({}));
    if (typeof body.active === "boolean") return reply(await setCarouselActive(o.assetId, body.active));
    if (body.plan && typeof body.plan === "object") {
      const parsed = parsePlan(JSON.stringify(body.plan));
      if (!parsed.plan || parsed.errors.length) return NextResponse.json({ success: false, error: "The edit could not be read.", errors: parsed.errors }, { status: 400 });
      return reply(await editCarousel(o.assetId, parsed.plan));
    }
    return apiFailure("Send { active } or { plan }", 400);
  } catch (error) {
    return apiError(error, "Failed to update the carousel");
  }
}
