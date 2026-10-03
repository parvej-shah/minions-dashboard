import { recordSourceFetch } from "@/services/ideaSources";
import { asString, readJsonOrEmpty } from "@/server/http/body";
import { requireFields } from "@/server/http/body";
import { route } from "@/server/http/route";

// Called once per source item by 01_idea_harvester so the Sources tab can show a dead feed.
export const POST = route({ auth: "webhook", failure: "Failed to record source status" }, async ({ request }) => {
  const body = await readJsonOrEmpty(request);
  const { source_id } = requireFields(body, "source_id");
  await recordSourceFetch(source_id, body.ok !== false, asString(body.error));
  return { success: true };
});
