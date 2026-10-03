import { NextResponse } from "next/server";
import { authorizationUrl, isLinkedInConfigured, redirectUriFor } from "@/lib/linkedin";
import { route } from "@/server/http/route";

export const GET = route({ auth: "realTenant", failure: "Failed to initialize LinkedIn OAuth" }, ({ clientId, request }) => {
  const url = new URL(request.url);
  const requested = url.searchParams.get("return_to") || "/fleet";
  // A query parameter must never become an off-site redirect.
  const returnTo = requested.startsWith("/") ? requested : "/fleet";

  if (!isLinkedInConfigured()) {
    const failure = new URL(returnTo, url.origin);
    failure.searchParams.set("error", "LinkedIn OAuth is not configured yet. Add the LinkedIn client ID and secret, then try again.");
    return NextResponse.redirect(failure);
  }

  const state = Buffer.from(JSON.stringify({ clientId, returnTo, ts: Date.now() })).toString("base64");
  return NextResponse.redirect(authorizationUrl(redirectUriFor(url.origin), state));
});
