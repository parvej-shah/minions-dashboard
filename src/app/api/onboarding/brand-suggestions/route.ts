import { generateSuggestions } from "@/services/onboardingCopilot";
import { readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "provision", failure: "Failed to generate brand suggestions" }, async ({ request }) =>
  generateSuggestions(await readJsonOrEmpty(request))
);
