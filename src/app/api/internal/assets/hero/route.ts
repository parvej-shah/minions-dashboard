import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { verifyWebhookSecret } from "@/lib/security";
import { TERMINAL_HERO_STATUSES, type TerminalHeroStatus } from "@/constants/pipelineContracts";

/** Terminal states the hero workflow may report. PENDING is set by the drafter. */
const TERMINAL = TERMINAL_HERO_STATUSES;

/**
 * Attaches a generated cover image to an asset that was drafted without one.
 *
 * Image generation used to sit on the drafting critical path: Qwen Image 3.0
 * Pro took ~43s of a ~98s run (51%), so the writer waited nearly a minute after
 * the prose was finished before anything was reviewable. `02_idea_to_asset` now
 * saves the asset with `hero_status: PENDING` and hands the image off to
 * `04_hero_image`, which calls this when the image lands.
 *
 * The body markdown embeds the hero as its first line, so this has to rewrite
 * `content` as well as set the column -- otherwise the published post would
 * carry no cover even though the asset row had one.
 */
export async function POST(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const assetId = typeof body.asset_id === "string" ? body.asset_id.trim() : "";
    const status = typeof body.hero_status === "string" ? body.hero_status.trim() : "";

    if (!assetId) return apiFailure("asset_id is required", 400);
    if (!TERMINAL.includes(status as TerminalHeroStatus)) {
      return apiFailure(`hero_status must be one of ${TERMINAL.join(", ")}`, 400);
    }

    const heroUrl = typeof body.hero_image_url === "string" ? body.hero_image_url.trim() : "";
    if (status === "READY" && !heroUrl.startsWith("https://")) {
      return apiFailure("hero_status READY requires an https hero_image_url", 400);
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, content: true, title: true, heroStatus: true },
    });
    if (!asset) return apiFailure(`Asset ${assetId} not found`, 404);

    // Only a PENDING asset is waiting on this. Refusing the rest keeps a late or
    // duplicate delivery from overwriting a cover an operator already replaced
    // by hand, and makes a retry of the same run harmless.
    if (asset.heroStatus !== "PENDING") {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Asset is already ${asset.heroStatus}; nothing to attach.`,
      });
    }

    // The drafter writes `content` with no image line when the hero is pending,
    // so prepend rather than replace. Square brackets in the alt text would
    // break the markdown link, hence the strip.
    const existing = asset.content ?? "";
    const alt = (asset.title || "Cover image").replace(/[[\]]/g, "");
    const content =
      status === "READY" && !existing.startsWith("![")
        ? `![${alt}](${heroUrl})\n\n${existing}`
        : existing;

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        heroStatus: status,
        heroImageUrl: status === "READY" ? heroUrl : null,
        heroErrorCode:
          typeof body.hero_error_code === "string" ? body.hero_error_code.slice(0, 240) : null,
        heroProvider: typeof body.hero_provider === "string" ? body.hero_provider : null,
        heroAttempts: Number.isFinite(body.hero_attempts) ? Number(body.hero_attempts) : 1,
        content,
        updatedAt: new Date(),
      },
      select: { id: true, heroStatus: true, heroImageUrl: true },
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    return apiError(error, "Failed to attach hero image");
  }
}
