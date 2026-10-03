import { getAsset, removeAsset, updateAsset, type AssetRemovalMode } from "@/services/assets";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const GET = route<"tenant", Params>({ auth: "tenant", failure: "Failed to fetch asset" }, ({ clientId, params }) =>
  getAsset(clientId, params.id)
);

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update asset" }, async ({ clientId, params, request }) => ({
  success: true,
  asset: await updateAsset(clientId, params.id, await readJson(request)),
}));

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to delete or unpublish asset" }, async ({ clientId, params, request }) => {
  const mode: AssetRemovalMode = new URL(request.url).searchParams.get("mode") === "permanent" ? "permanent" : "unpublish";
  const asset = await removeAsset(clientId, params.id, mode);
  return asset
    ? { success: true, message: "Blog unpublished and reverted to review queue", asset }
    : { success: true, message: "Asset and live blog permanently deleted" };
});
