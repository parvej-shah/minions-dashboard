import { getTenantDetail, setAssetsPerMonthOverride } from "@/services/platformAdmin";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const GET = route<"staff", Params>({ auth: "staff", failure: "Failed to load tenant detail" }, ({ params }) => getTenantDetail(params.id));

export const PATCH = route<"staff", Params>({ auth: "staff", failure: "Failed to update tenant" }, async ({ params, request }) =>
  setAssetsPerMonthOverride(params.id, await readJson(request))
);
