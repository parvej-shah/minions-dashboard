import { createFollowUp } from "@/services/followUp";
import { route } from "@/server/http/route";

// Writing the new post text and polishing it: two model calls and a Jev check.
export const maxDuration = 120;

type Params = { id: string };

// Drafts the second LinkedIn post of a published draft, or returns the one already drafted.
export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Could not draft the second post" }, async ({ clientId, params }) => {
  const { created, asset } = await createFollowUp(clientId, params.id);
  return { success: true, created, asset };
});
