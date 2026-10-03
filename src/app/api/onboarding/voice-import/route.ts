import { importLinkedInVoice } from "@/services/voiceImport";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "realTenant", failure: "Failed to import LinkedIn voice profile" }, async ({ clientId, request }) =>
  importLinkedInVoice(clientId, await readJsonOrEmpty(request))
);
