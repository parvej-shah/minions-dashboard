import { NextResponse } from "next/server";
import { requireClientId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const rawState = url.searchParams.get("state");
  let returnTo = "/fleet";
  if (rawState) {
    try {
      const parsed = JSON.parse(Buffer.from(rawState, "base64").toString("utf-8"));
      if (parsed.returnTo) returnTo = parsed.returnTo;
    } catch (e) {}
  }

  const fallbackRedirect = returnTo.includes("/onboarding") ? "/onboarding/setup" : "/fleet";
  const onboardingFailure = (message: string) => {
    const failureUrl = new URL(fallbackRedirect, request.url);
    failureUrl.searchParams.set("error", message);
    return NextResponse.redirect(failureUrl);
  };

  if (error) {
    console.error("LinkedIn OAuth Error:", error, errorDescription);
    return onboardingFailure(errorDescription || error);
  }

  if (!code) {
    return onboardingFailure("LinkedIn did not return an authorization code. Please try connecting again.");
  }

  const redirectUri = process.env.LINKEDIN_REDIRECT_URI?.trim() || `${url.origin}/api/auth/linkedin/callback`;

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
      return onboardingFailure("LinkedIn could not complete the authorization exchange. Check the configured redirect URL and try again.");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // DIRECT ONBOARDING ROUTE: If connecting from onboarding, automatically save personal profile & return straight to /onboarding/setup!
    if (returnTo.includes("/onboarding")) {
      let personUrn = "";
      try {
        const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.sub) {
            personUrn = `urn:li:person:${profile.sub}`;
          }
        }
      } catch (e) {
        console.warn("Direct onboarding UserInfo fetch error:", e);
      }

      if (personUrn) {
        // Encrypt token into Supabase Vault
        const { data: secretId, error: vaultError } = await getSupabaseAdmin().rpc("create_channel_secret", {
          secret: accessToken,
          name: `${ctx.clientId}:linkedin:${Date.now()}`,
        });

        if (!vaultError && secretId) {
          // Save to database
          await prisma.clientChannel.upsert({
            where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: "linkedin" } },
            update: { isActive: true, credentialRef: secretId, externalId: personUrn },
            create: { clientId: ctx.clientId, channelKey: "linkedin", isActive: true, credentialRef: secretId, externalId: personUrn },
          });

          // Redirect directly back to onboarding setup without intermediate page drift!
          return NextResponse.redirect(new URL("/onboarding/setup?imported=true", request.url));
        }

        console.error("LinkedIn onboarding credential save failed:", vaultError);
        return onboardingFailure("LinkedIn connected, but Minions could not save the credential. Please try again.");
      }

      return onboardingFailure("LinkedIn did not return a usable member profile. Ensure this app has OpenID Connect access, then try again.");
    }

    // Standard fleet selection flow if connecting from Fleet
    const selectUrl = new URL("/fleet/linkedin/select", request.url);
    if (returnTo) {
      selectUrl.searchParams.set("return_to", returnTo);
    }
    const response = NextResponse.redirect(selectUrl);

    response.cookies.set("linkedin_pending_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth Callback Exception:", err);
    return onboardingFailure("LinkedIn connection encountered an internal error. Please try again.");
  }
}
