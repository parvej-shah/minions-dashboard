import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";

export async function GET(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("LinkedIn OAuth Error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/fleet?error=${encodeURIComponent(errorDescription || error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/fleet?error=No+code+provided", request.url));
  }

  const redirectUri = `${url.protocol}//${url.host}/api/auth/linkedin/callback`;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error("Failed to exchange token:", errData);
      return NextResponse.redirect(new URL("/fleet?error=Token+exchange+failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // We have the token! Now we need the user to select which page/profile to use.
    // We will store the token temporarily in an HttpOnly cookie and redirect them to the selection UI.
    const response = NextResponse.redirect(new URL("/fleet/linkedin/select", request.url));
    
    // Store token securely in an HttpOnly cookie for the next step.
    // In production, encrypting this cookie is recommended, but HttpOnly + Secure prevents XSS extraction.
    response.cookies.set("linkedin_pending_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes to finish selection
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth Callback Exception:", err);
    return NextResponse.redirect(new URL("/fleet?error=Internal+OAuth+Error", request.url));
  }
}
