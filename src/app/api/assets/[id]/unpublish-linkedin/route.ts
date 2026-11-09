import { HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";
import { unpublishFromLinkedIn } from "@/services/linkedinUnpublish";

type Params = { id: string };

// Deletes the post on LinkedIn, takes it off the blog, and returns the draft to review.
export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Failed to unpublish from LinkedIn" }, async ({ clientId, params }) => {
  const result = await unpublishFromLinkedIn(clientId, params.id);
  if (!result.ok) throw new HttpError(result.status, result.error);
  return { success: true, asset: result.asset };
});
