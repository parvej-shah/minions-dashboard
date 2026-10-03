import { deleteIdea, getIdea, updateIdea } from "@/services/ideas";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";

type Params = { id: string };

export const GET = route<"tenant", Params>({ auth: "tenant", failure: "Failed to fetch idea" }, ({ clientId, params }) =>
  getIdea(clientId, params.id)
);

export const PATCH = route<"tenant", Params>({ auth: "tenant", failure: "Failed to update idea" }, async ({ clientId, params, request }) => ({
  success: true,
  idea: await updateIdea(clientId, params.id, await readJson(request)),
}));

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to delete idea" }, async ({ clientId, params }) => {
  await deleteIdea(clientId, params.id);
  return { success: true, id: params.id };
});
