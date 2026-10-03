import { ingestImage } from "@/services/mediaIngest";
import { asString, asOptionalString, readJson } from "@/server/http/body";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const POST = route({ auth: "webhook", failure: "Upload failed" }, async ({ request }) => {
  const body = await readJson(request, "Body must be JSON.");
  const sourceUrl = asString(body.source_url);
  if (!sourceUrl) throw badRequest("source_url is required.");

  try {
    return await ingestImage(sourceUrl, asOptionalString(body.key_prefix), asOptionalString(body.filename));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});
