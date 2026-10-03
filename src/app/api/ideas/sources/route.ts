import { createIdeaSource, listIdeaSources } from "@/services/ideaSources";
import { readJson } from "@/server/http/body";
import { created } from "@/server/http/respond";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch idea sources" }, ({ clientId }) => listIdeaSources(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to create idea source" }, async ({ clientId, request }) =>
  created(await createIdeaSource(clientId, await readJson(request)))
);
