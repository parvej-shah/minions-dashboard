import { readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";
import { checkCoverTemplate } from "@/services/coverTemplates";

/** Body: { html }. Draws three previews or lists what breaks the contract; saves nothing. */
export const POST = route({ auth: "tenant", failure: "Could not check the design" }, async ({ clientId, request }) => {
  const body = await readJson(request);
  if (typeof body.html !== "string") throw badRequest("html must be text.");
  return checkCoverTemplate(clientId, body.html);
});
