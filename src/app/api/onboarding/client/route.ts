import { findPlan } from "@/constants/plans";
import { createWorkspace } from "@/services/workspace";
import { asString, readJson } from "@/server/http/body";
import { badRequest, conflict } from "@/server/http/errors";
import { created } from "@/server/http/respond";
import { route } from "@/server/http/route";

// plan_key is validated but not persisted: billing has no Subscription row until Stripe checkout completes.
export const POST = route({ auth: "session", failure: "Failed to create client" }, async ({ user, request }) => {
  if (user.clientId) throw conflict("Account is already attached to a tenant");

  const body = await readJson(request);
  const name = asString(body.name);
  const planKey = asString(body.plan_key);
  if (!name) throw badRequest("name is required");
  const plan = findPlan(planKey);
  if (!plan) throw badRequest(`Unknown plan_key: ${planKey}`);

  const client = await createWorkspace(user, name);
  return created({ id: client.id, slug: client.slug, plan_key: plan.key });
});
