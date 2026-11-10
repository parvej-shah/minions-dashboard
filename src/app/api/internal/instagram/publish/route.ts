import { publishToInstagram } from "@/services/instagramPublish";
import { asString, readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

/** n8n 03 calls this after a post goes out; Instagram's result never fails the run. */
export const POST = route({ auth: "webhook", failure: "Failed to publish to Instagram" }, async ({ request }) => {
  const assetId = asString((await readJson(request)).asset_id);
  if (!assetId) throw badRequest("asset_id is required");
  return publishToInstagram(assetId);
});
