import { route } from "@/server/http/route";
import { archiveCoverTemplate } from "@/services/coverTemplates";

type Params = { id: string };

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Could not remove the design" }, async ({ clientId, params }) => {
  await archiveCoverTemplate(clientId, params.id);
  return { success: true };
});
