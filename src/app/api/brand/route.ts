import { getBrandSettings, updateBrandSettings } from "@/services/brand";
import { parseBrandProfileInput } from "@/lib/brandInput";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch brand settings" }, ({ clientId }) => getBrandSettings(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to update brand settings" }, async ({ clientId, request }) =>
  updateBrandSettings(clientId, parseBrandProfileInput(await readJson(request)))
);
