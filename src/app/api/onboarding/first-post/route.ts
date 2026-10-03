import { getFirstPostState, startFirstPost, validateStory } from "@/services/firstPost";
import { readJsonOrEmpty } from "@/server/http/body";
import { authorize, route } from "@/server/http/route";

export const GET = route({ auth: "tenant", failure: "Could not check on your first post" }, ({ clientId }) => getFirstPostState(clientId));

// Setup validates the story before the workspace exists, so that step needs only a signed-in user.
export const POST = route({ auth: "public", failure: "Could not start your first post" }, async ({ request }) => {
  const body = await readJsonOrEmpty(request);
  if (body.validate === true) {
    await authorize("session", request);
    return validateStory(body.story);
  }
  const { clientId } = await authorize("tenant", request);
  return startFirstPost(clientId, body);
});
