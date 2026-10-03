import { saveVoiceProfile } from "@/services/onboardingVoice";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "tenant", failure: "Failed to save voice profile" }, async ({ clientId, request }) =>
  saveVoiceProfile(clientId, await readJson(request))
);
