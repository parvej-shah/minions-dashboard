import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { isPlaceholderTenantName, requireClientId } from "@/lib/tenant";
import { renderAssetCover } from "@/services/cover";
import { FIRST_POST_TAG } from "@/constants/firstPost";

export const maxDuration = 60;

const NAME_MAX = 60;
const ROLE_MAX = 90;

/**
 * The cover's author line, asked for last in setup ("How should your covers
 * sign off?"): the name and the line under it. Saves them to the brand and,
 * when they changed, redraws the first post's cover with the same headline
 * and illustration so the user sees their own name on it in review.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role = typeof body?.role === "string" ? body.role.trim() : "";
    if (!name) return apiFailure("Add the name to show on your covers.", 400);
    if (name.length > NAME_MAX) return apiFailure(`Keep the name under ${NAME_MAX} characters.`, 400);
    if (role.length > ROLE_MAX) return apiFailure(`Keep the line under your name under ${ROLE_MAX} characters.`, 400);

    const [profile, client] = await Promise.all([
      prisma.brandProfile.findUnique({ where: { clientId: ctx.clientId }, select: { brandName: true, coverByline: true } }),
      prisma.client.findUnique({ where: { id: ctx.clientId }, select: { name: true } }),
    ]);
    if (!profile) return apiFailure("Finish setup first.", 409);

    const changed = profile.brandName !== name || (profile.coverByline ?? "") !== role;
    if (!changed) return NextResponse.json({ success: true, hero_image_url: null });

    // An empty line keeps the cover's automatic one (from the positioning).
    await prisma.brandProfile.update({ where: { clientId: ctx.clientId }, data: { brandName: name, coverByline: role || null } });
    if (isPlaceholderTenantName(client?.name)) {
      await prisma.client.update({ where: { id: ctx.clientId }, data: { name } });
    }

    const asset = await prisma.asset.findFirst({
      where: { clientId: ctx.clientId, idea: { tags: { has: FIRST_POST_TAG } } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!asset) return NextResponse.json({ success: true, hero_image_url: null });

    // An empty edit keeps the drawn layout, headline and illustration; only the author line changes.
    const cover = await renderAssetCover(asset.id, { edit: {} });
    // The name is saved either way; a cover that can't be redrawn keeps the old one.
    return NextResponse.json({ success: true, hero_image_url: cover.ok ? cover.url : null, cover_error: cover.ok ? null : cover.error });
  } catch (error) {
    return apiError(error, "Could not save how your covers sign off");
  }
}
