import { generateDirectives } from "@/services/onboardingCopilot";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const POST = route({ auth: "provision", failure: "Failed to generate brand directives with Copilot" }, async ({ request }) =>
  generateDirectives(await readJson(request))
);
