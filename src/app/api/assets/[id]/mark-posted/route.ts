import { markPosted } from "@/services/markPosted";
import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

type Params = { id: string };

// The reviewer posted this draft to LinkedIn by hand; record it without sending anything.
export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Failed to mark the post as posted" }, async ({ clientId, params }) => {
  const result = await markPosted(clientId, params.id);
  if (!result.ok) throw new HttpError(result.status, result.error);
  return { success: true, status: "PUBLISHED", published_at: result.published_at, linkedin_went_as: result.linkedin_went_as };
});
