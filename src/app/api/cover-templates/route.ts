import { asOptionalString, readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";
import { getUseOnlyMyDesigns, listCoverTemplates, saveCoverTemplate } from "@/services/coverTemplates";

export const GET = route({ auth: "tenant", failure: "Could not load designs" }, async ({ clientId }) => ({ templates: await listCoverTemplates(clientId), only_mine: await getUseOnlyMyDesigns(clientId) }));

/** Body: { html, template_id? }. Saves only when the whole contract check passes; otherwise 422 with { errors }. */
export const POST = route({ auth: "tenant", failure: "Could not save the design" }, async ({ clientId, user, request }) => {
  const body = await readJson(request);
  if (typeof body.html !== "string") throw badRequest("html must be text.");
  return { template: await saveCoverTemplate(clientId, user.id, body.html, asOptionalString(body.template_id, 64)) };
});
