import { prisma } from "@/lib/prisma";
import { TERMINAL_HERO_STATUSES, type TerminalHeroStatus } from "@/constants/pipelineContracts";
import { settleSlotDraft } from "@/services/contentPlan";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";

const MAX_ERROR_CODE_LENGTH = 240;

const withHeroLine = (content: string, title: string, heroUrl: string) => {
  const alt = (title || "Cover image").replace(/[[\]]/g, "");
  return content.startsWith("![") ? content : `![${alt}](${heroUrl})\n\n${content}`;
};

export async function attachHero(body: JsonObject) {
  const assetId = asString(body.asset_id);
  const status = asString(body.hero_status) as TerminalHeroStatus;
  const heroUrl = asString(body.hero_image_url);

  if (!assetId) throw badRequest("asset_id is required");
  if (!TERMINAL_HERO_STATUSES.includes(status)) throw badRequest(`hero_status must be one of ${TERMINAL_HERO_STATUSES.join(", ")}`);
  if (status === "READY" && !heroUrl.startsWith("https://")) throw badRequest("hero_status READY requires an https hero_image_url");

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, content: true, title: true, heroStatus: true },
  });
  if (!asset) throw notFound(`Asset ${assetId} not found`);

  // Only a PENDING asset is waiting on this, so a late or duplicate delivery cannot overwrite a cover an operator replaced.
  if (asset.heroStatus !== "PENDING") {
    return { success: true, skipped: true, reason: `Asset is already ${asset.heroStatus}; nothing to attach.` };
  }

  const existing = asset.content ?? "";
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: {
      heroStatus: status,
      heroImageUrl: status === "READY" ? heroUrl : null,
      heroErrorCode: typeof body.hero_error_code === "string" ? body.hero_error_code.slice(0, MAX_ERROR_CODE_LENGTH) : null,
      heroProvider: typeof body.hero_provider === "string" ? body.hero_provider : null,
      heroAttempts: Number.isFinite(body.hero_attempts) ? Number(body.hero_attempts) : 1,
      content: status === "READY" ? withHeroLine(existing, asset.title, heroUrl) : existing,
      updatedAt: new Date(),
    },
    select: { id: true, heroStatus: true, heroImageUrl: true },
  });

  const slot = await settleSlotDraft(assetId);
  return { success: true, asset: updated, ...(slot && slot !== "NOT_A_SLOT" ? { slot } : {}) };
}
