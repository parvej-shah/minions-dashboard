import { scrubBannedWords } from "@/services/bannedScrub";
import { readJsonOrEmpty, requireFields } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 120;

export const POST = route({ auth: "webhook", failure: "Failed to scrub banned words" }, async ({ request }) => {
  const body = await readJsonOrEmpty(request);
  const { client_id } = requireFields(body, "client_id");
  const { texts } = body;
  if (!texts || typeof texts !== "object" || Array.isArray(texts)) throw badRequest("client_id and texts are required");

  const strings = Object.fromEntries(Object.entries(texts).map(([key, value]) => [key, typeof value === "string" ? value : ""]));
  return scrubBannedWords(client_id, strings);
});
