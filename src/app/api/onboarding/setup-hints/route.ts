import { suggestSetupHint } from "@/services/onboardingCopilot";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "provision", failure: "Failed to suggest an example" }, async ({ request, clientId }) =>
  suggestSetupHint(clientId, await readJsonOrEmpty(request))
);
