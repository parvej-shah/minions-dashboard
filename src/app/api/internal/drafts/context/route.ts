import { getDraftAuthorContext } from "@/services/draftContext";
import { recordHeartbeat } from "@/services/jobHeartbeat";
import { readJsonOrEmpty, requireFields } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "webhook", failure: "Failed to load the draft's author context" }, async ({ request }) => {
  await recordHeartbeat("02_idea_to_asset");
  const { client_id, idea_id } = requireFields(await readJsonOrEmpty(request), "client_id", "idea_id");
  return { author: await getDraftAuthorContext(client_id, idea_id) };
});
