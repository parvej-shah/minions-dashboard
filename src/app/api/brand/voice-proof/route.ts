import { getVoiceAndProof, saveVoiceAndProof } from "@/services/voiceProof";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to load voice and proof settings" }, ({ clientId }) => getVoiceAndProof(clientId));

export const PUT = route({ auth: "tenant", failure: "Failed to save voice and proof settings" }, async ({ clientId, request }) =>
  saveVoiceAndProof(clientId, await readJson(request))
);
