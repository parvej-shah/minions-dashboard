import { saveOnboardingSetup } from "@/services/onboardingSetup";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "provision", failure: "Failed to save onboarding setup" }, async ({ clientId, request }) =>
  saveOnboardingSetup(clientId, await readJson(request))
);
