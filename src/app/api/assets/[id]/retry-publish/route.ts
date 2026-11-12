import { prisma } from "@/lib/prisma";
import { ownedAssetWhere } from "@/services/assets";
import { publishToLinkedIn } from "@/services/linkedinPublish";
import { publishToInstagram } from "@/services/instagramPublish";
import { readJsonOrEmpty } from "@/server/http/body";
import { badRequest, conflict, notFound } from "@/server/http/errors";
import { route } from "@/server/http/route";

type Params = { id: string };

/** Posts an already-published draft to one channel that refused it. Body: { channel: "linkedin" | "instagram" }. */
export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Failed to post again" }, async ({ clientId, params, request }) => {
  const channel = (await readJsonOrEmpty(request)).channel;
  if (channel !== "linkedin" && channel !== "instagram") throw badRequest('channel must be "linkedin" or "instagram".');
  const asset = await prisma.asset.findFirst({ where: ownedAssetWhere(clientId, params.id), select: { id: true, status: true } });
  if (!asset) throw notFound("Draft not found");
  if (asset.status !== "PUBLISHED") throw conflict("Only a post that already went out can be posted again.");

  const result = channel === "linkedin" ? await publishToLinkedIn(asset.id) : await publishToInstagram(asset.id);
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, skipped: "skipped" in result ? result.skipped : null };
});
