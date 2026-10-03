import { prisma } from "@/lib/prisma";
import { isPlaceholderTenantName } from "@/lib/tenant";
import { FIRST_POST_TAG } from "@/constants/firstPost";
import { renderAssetCover } from "@/services/cover";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, conflict } from "@/server/http/errors";

const SIGNOFF_NAME_MAX = 60;
const SIGNOFF_ROLE_MAX = 90;

export async function saveSignoff(clientId: string, body: JsonObject) {
  const name = asString(body.name);
  const role = asString(body.role);
  if (!name) throw badRequest("Add the name to show on your covers.");
  if (name.length > SIGNOFF_NAME_MAX) throw badRequest(`Keep the name under ${SIGNOFF_NAME_MAX} characters.`);
  if (role.length > SIGNOFF_ROLE_MAX) throw badRequest(`Keep the line under your name under ${SIGNOFF_ROLE_MAX} characters.`);

  const [profile, client] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { clientId }, select: { brandName: true, coverByline: true } }),
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
  ]);
  if (!profile) throw conflict("Finish setup first.");

  const unchanged = profile.brandName === name && (profile.coverByline ?? "") === role;
  if (unchanged) return { success: true, hero_image_url: null };

  await prisma.brandProfile.update({ where: { clientId }, data: { brandName: name, coverByline: role || null } });
  if (isPlaceholderTenantName(client?.name)) await prisma.client.update({ where: { id: clientId }, data: { name } });

  const asset = await prisma.asset.findFirst({
    where: { clientId, idea: { tags: { has: FIRST_POST_TAG } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!asset) return { success: true, hero_image_url: null };

  // An empty edit keeps the drawn layout, headline and illustration; only the author line changes.
  const cover = await renderAssetCover(asset.id, { edit: {} });
  return { success: true, hero_image_url: cover.ok ? cover.url : null, cover_error: cover.ok ? null : cover.error };
}
