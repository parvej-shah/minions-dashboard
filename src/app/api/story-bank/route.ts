import { extractPaste, extractStory, finishSession, getStoryBank, saveStories } from "@/services/storyBank";
import { readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// An answer is turned into items by a model call and each item is checked.
export const maxDuration = 90;

export const GET = route({ auth: "tenant", failure: "Failed to load your story bank" }, ({ clientId }) => getStoryBank(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to save your story" }, async ({ clientId, request }) => {
  const body = await readJson(request, "Expected a JSON object.");
  if (body.action === "extract") return extractStory(clientId, body);
  if (body.action === "paste") return extractPaste(clientId, body);
  if (body.action === "save") return saveStories(clientId, body);
  if (body.action === "finish") return finishSession(clientId);
  throw badRequest('action must be "extract", "paste", "save" or "finish".');
});
