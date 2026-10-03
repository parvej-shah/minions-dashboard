import { answerPulse, getPulse, skipPulse, snoozePulse } from "@/services/pulse";
import { readJson } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

// The answer is turned into items by a model call and each item is checked.
export const maxDuration = 90;

export const GET = route({ auth: "tenant", failure: "Failed to load this week's question" }, ({ clientId }) => getPulse(clientId));

export const POST = route({ auth: "tenant", failure: "Failed to save your answer" }, async ({ clientId, request }) => {
  const body = await readJson(request, "Expected a JSON object.");
  if (body.action === "answer") return answerPulse(clientId, body);
  if (body.action === "snooze") return snoozePulse(clientId);
  if (body.action === "skip") return skipPulse(clientId);
  throw badRequest('action must be "answer", "snooze" or "skip".');
});
