import { scrubBannedWords } from "@/services/bannedScrub";
import { polishDraft } from "@/services/draftPolish";
import { readJsonOrEmpty, requireFields } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const maxDuration = 120;

/**
 * 02's last pass over a draft's texts: first the one rewrite for a draft that
 * still reads as machine-written, then the banned-word repair, so a rewrite
 * can never bring a banned word back. 02 reads `texts`; `polish` is for logs.
 */
export const POST = route({ auth: "webhook", failure: "Failed to scrub banned words" }, async ({ request }) => {
  const body = await readJsonOrEmpty(request);
  const { client_id } = requireFields(body, "client_id");
  const { texts } = body;
  if (!texts || typeof texts !== "object" || Array.isArray(texts)) throw badRequest("client_id and texts are required");

  const strings = Object.fromEntries(Object.entries(texts).map(([key, value]) => [key, typeof value === "string" ? value : ""]));
  const polished = await polishDraft(strings).catch((e) => {
    console.warn("[polish] failed, keeping the draft as written:", e);
    return { texts: strings, report: {} };
  });
  const scrubbed = await scrubBannedWords(client_id, polished.texts);
  return { ...scrubbed, polish: polished.report };
});
