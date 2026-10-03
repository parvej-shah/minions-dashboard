import { createDirective, listDirectives } from "@/services/brandDirectives";
import { created } from "@/server/http/respond";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch brand directives" }, ({ clientId }) => listDirectives(clientId));

// Shared with the Brand and Settings pages; only the onboarding wizard's writes (from_onboarding) are refused for an established workspace.
export const POST = route({ auth: "tenant", failure: "Failed to create brand directive" }, async ({ clientId, request }) =>
  created(await createDirective(clientId, await readJson(request)))
);
