import { NextResponse } from "next/server";
import { exchangeCode, fetchUserInfo, PENDING_EXPIRY_COOKIE, PENDING_TOKEN_COOKIE, personUrn, redirectUriFor } from "@/lib/linkedin";
import { DEFAULT_TOKEN_DAYS } from "@/lib/linkedinHealth";
import { storeChannelCredential } from "@/services/channels";
import { route } from "@/server/http/route";

const PENDING_TOKEN_TTL_SECONDS = 60 * 10;

function returnToFrom(rawState: string | null): string {
  try {
    return JSON.parse(Buffer.from(rawState ?? "", "base64").toString("utf-8")).returnTo || "/fleet";
  } catch {
    return "/fleet";
  }
}

export const GET = route({ auth: "tenant", failure: "LinkedIn connection encountered an internal error. Please try again." }, async ({ clientId, request }) => {
  const url = new URL(request.url);
  const returnTo = returnToFrom(url.searchParams.get("state"));
  const fromOnboarding = returnTo.includes("/onboarding");
  const fail = (message: string) => {
    const failure = new URL(fromOnboarding ? "/onboarding/setup" : "/fleet", request.url);
    failure.searchParams.set("error", message);
    return NextResponse.redirect(failure);
  };

  const providerError = url.searchParams.get("error");
  if (providerError) {
    console.error("[linkedin] OAuth error:", providerError, url.searchParams.get("error_description"));
    return fail(url.searchParams.get("error_description") || providerError);
  }
  const code = url.searchParams.get("code");
  if (!code) return fail("LinkedIn did not return an authorization code. Please try connecting again.");

  const exchanged = await exchangeCode(code, redirectUriFor(url.origin));
  if (!exchanged) {
    return fail("LinkedIn could not complete the authorization exchange. Check the configured redirect URL and try again.");
  }

  const accessToken = exchanged.token;
  const expiresAt = new Date(Date.now() + (exchanged.expiresIn ?? DEFAULT_TOKEN_DAYS * 86_400) * 1000);

  if (fromOnboarding) {
    const user = await fetchUserInfo(accessToken).catch(() => null);
    const sub = user && "profile" in user ? user.profile.sub : null;
    if (!sub) return fail("LinkedIn did not return a usable member profile. Ensure this app has OpenID Connect access, then try again.");

    try {
      await storeChannelCredential(clientId, "linkedin", accessToken, personUrn(sub), expiresAt);
    } catch (error) {
      console.error("[linkedin] onboarding credential save failed:", error);
      return fail("LinkedIn connected, but Minions could not save the credential. Please try again.");
    }
    return NextResponse.redirect(new URL("/onboarding/setup?imported=true", request.url));
  }

  const selectUrl = new URL("/fleet/linkedin/select", request.url);
  selectUrl.searchParams.set("return_to", returnTo);
  const response = NextResponse.redirect(selectUrl);
  const cookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: PENDING_TOKEN_TTL_SECONDS, path: "/" };
  response.cookies.set(PENDING_TOKEN_COOKIE, accessToken, cookie);
  response.cookies.set(PENDING_EXPIRY_COOKIE, expiresAt.toISOString(), cookie);
  return response;
});
