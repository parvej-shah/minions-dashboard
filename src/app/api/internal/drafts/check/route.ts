import { runDraftCheck } from "@/services/draftCheck";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "webhook", failure: "Failed to check the draft" }, async ({ request }) =>
  runDraftCheck(await readJson(request))
);
