import { cookies } from "next/headers";
import { PENDING_EXPIRY_COOKIE, PENDING_TOKEN_COOKIE } from "@/lib/linkedin";
import { storeChannelCredential } from "@/services/channels";
import { asString, readJson } from "@/server/http/body";
import { badRequest, HttpError } from "@/server/http/errors";
import { route } from "@/server/http/route";

export const POST = route({ auth: "realTenant", failure: "Failed to save LinkedIn connection" }, async ({ clientId, request }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_TOKEN_COOKIE)?.value;
  if (!token) throw new HttpError(401, "Session expired. Please try connecting again.");

  const urn = asString((await readJson(request)).urn);
  if (!urn.startsWith("urn:li:")) throw badRequest("Valid LinkedIn URN is required");

  const rawExpiry = Date.parse(cookieStore.get(PENDING_EXPIRY_COOKIE)?.value ?? "");
  await storeChannelCredential(clientId, "linkedin", token, urn, Number.isNaN(rawExpiry) ? null : new Date(rawExpiry));
  cookieStore.delete(PENDING_TOKEN_COOKIE);
  cookieStore.delete(PENDING_EXPIRY_COOKIE);
  return { success: true };
});
