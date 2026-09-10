import { NextResponse } from "next/server";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError } from "@/lib/api-response";

export async function GET(request: Request) {
  const ctx = await requireRealTenantUser(true);
  if ("error" in ctx) return ctx.error;

  try {
    const url = new URL(request.url);
    const requestedReturnTo = url.searchParams.get("return_to") || "/fleet";
    // OAuth must never turn a query parameter into an off-site redirect.
    const returnTo = requestedReturnTo.startsWith("/") ? requestedReturnTo : "/fleet";
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI?.trim() || `${url.origin}/api/auth/linkedin/callback`;

    if (!process.env.LINKEDIN_CLIENT_ID?.trim() || !process.env.LINKEDIN_CLIENT_SECRET?.trim()) {
      const failureUrl = new URL(returnTo, url.origin);
      failureUrl.searchParams.set("error", "LinkedIn OAuth is not configured yet. Add the LinkedIn client ID and secret, then try again.");
      return NextResponse.redirect(failureUrl);
    }

    const linkedInAuthUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    linkedInAuthUrl.searchParams.append("response_type", "code");
    linkedInAuthUrl.searchParams.append("client_id", process.env.LINKEDIN_CLIENT_ID || "");
    linkedInAuthUrl.searchParams.append("redirect_uri", redirectUri);
    // Request permissions for profile, email, and member posting
    linkedInAuthUrl.searchParams.append("scope", "openid profile email w_member_social");
    
    const state = Buffer.from(JSON.stringify({ clientId: ctx.clientId, returnTo, ts: Date.now() })).toString("base64");
    linkedInAuthUrl.searchParams.append("state", state);

    return NextResponse.redirect(linkedInAuthUrl.toString());
  } catch (error) {
    return apiError(error, "Failed to initialize LinkedIn OAuth");
  }
}
