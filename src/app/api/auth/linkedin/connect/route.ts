import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";
import { apiError } from "@/lib/api-response";

export async function GET(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const url = new URL(request.url);
    // Base URL for the redirect callback
    const redirectUri = `${url.protocol}//${url.host}/api/auth/linkedin/callback`;

    const linkedInAuthUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    linkedInAuthUrl.searchParams.append("response_type", "code");
    linkedInAuthUrl.searchParams.append("client_id", process.env.LINKEDIN_CLIENT_ID || "");
    linkedInAuthUrl.searchParams.append("redirect_uri", redirectUri);
    // Request permissions for profile, email, and member posting
    linkedInAuthUrl.searchParams.append("scope", "openid profile email w_member_social");
    
    // We pass the clientId in the state to ensure we attach it to the correct tenant on return,
    // although the session cookie should also be present.
    // In a real prod app, we should HMAC this state to prevent CSRF, but this suffices for MVP.
    const state = Buffer.from(JSON.stringify({ clientId: ctx.clientId, ts: Date.now() })).toString("base64");
    linkedInAuthUrl.searchParams.append("state", state);

    return NextResponse.redirect(linkedInAuthUrl.toString());
  } catch (error) {
    return apiError(error, "Failed to initialize LinkedIn OAuth");
  }
}
