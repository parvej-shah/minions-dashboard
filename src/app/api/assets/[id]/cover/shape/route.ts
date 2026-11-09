import { requireOwnedAssetId } from "@/services/assets";
import { readCoverShape } from "@/services/cover";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 30;

/** Reads the post's points onto its cover, so the Studio knows which layouts fit. Never redraws. */
export const POST = route<"tenant", { id: string }>({ auth: "tenant", failure: "Failed to read the post's points" }, async ({ clientId, params }) => {
  const assetId = await requireOwnedAssetId(clientId, params.id);
  const result = await readCoverShape(assetId);
  if (!result.ok) throw new HttpError(422, result.error);
  return { success: true };
});
