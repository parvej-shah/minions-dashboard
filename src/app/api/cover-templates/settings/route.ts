import { readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";
import { setUseOnlyMyDesigns } from "@/services/coverTemplates";

/** Body: { only_mine: boolean }. "Use only my designs" takes the built-in designs out of the rotation. */
export const PATCH = route({ auth: "tenant", failure: "Could not change the setting" }, async ({ clientId, request }) => {
  const body = await readJson(request);
  if (typeof body.only_mine !== "boolean") throw badRequest("only_mine must be true or false.");
  await setUseOnlyMyDesigns(clientId, body.only_mine);
  return { only_mine: body.only_mine };
});
