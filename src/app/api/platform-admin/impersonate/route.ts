import { cookies } from "next/headers";
import { IMPERSONATION_COOKIE } from "@/lib/tenant";
import { findClientSummary as findClient } from "@/services/platformAdmin";
import { asString, readJson } from "@/server/http/body";
import { badRequest, notFound } from "@/server/http/errors";
import { route } from "@/server/http/route";

const SESSION_SECONDS = 2 * 60 * 60;

export const GET = route({ auth: "staff", failure: "Failed to read the view-as-tenant session" }, async () => {
  const clientId = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  const client = clientId ? await findClient(clientId) : null;
  return client ? { impersonating: true, client } : { impersonating: false, client: null };
});

// The session lives in a cookie only; see requireTenantAccess.
export const POST = route({ auth: "staff", failure: "Failed to start impersonation" }, async ({ request }) => {
  const clientId = asString((await readJson(request)).client_id);
  if (!clientId) throw badRequest("client_id is required");
  const client = await findClient(clientId);
  if (!client) throw notFound("Client not found");

  (await cookies()).set(IMPERSONATION_COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
  return { success: true, client };
});

export const DELETE = route({ auth: "staff", failure: "Failed to end the view-as-tenant session" }, async () => {
  (await cookies()).delete(IMPERSONATION_COOKIE);
  return { success: true };
});
