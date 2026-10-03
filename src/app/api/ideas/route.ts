import { createIdea, listIdeas, queueIdeas } from "@/services/ideas";
import { created } from "@/server/http/respond";
import { badRequest } from "@/server/http/errors";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Failed to fetch ideas" }, ({ clientId }) => listIdeas(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to create idea" }, async ({ clientId, request }) =>
  created(await createIdea(clientId, await readJson(request)))
);

export const PATCH = route({ auth: "tenant", failure: "Failed to update idea queue" }, async ({ clientId, request }) => {
  const { queueItems } = await readJson(request);
  if (!Array.isArray(queueItems)) throw badRequest("Invalid payload: expected a queueItems array");
  const count = await queueIdeas(clientId, queueItems);
  return { success: true, count };
});
