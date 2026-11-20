import { optionalEnv } from "@/lib/env";

const API_URL = "https://api.linkedin.com/v2";
const OAUTH_URL = "https://www.linkedin.com/oauth/v2";
const SCOPES = "openid profile email w_member_social";

export const PENDING_TOKEN_COOKIE = "linkedin_pending_token";
export const PENDING_EXPIRY_COOKIE = "linkedin_pending_expiry";

export interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
}

export const isLinkedInConfigured = () => Boolean(optionalEnv("LINKEDIN_CLIENT_ID") && optionalEnv("LINKEDIN_CLIENT_SECRET"));

export const redirectUriFor = (origin: string) => optionalEnv("LINKEDIN_REDIRECT_URI") ?? `${origin}/api/auth/linkedin/callback`;

export function authorizationUrl(redirectUri: string, state: string): string {
  const url = new URL(`${OAUTH_URL}/authorization`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", optionalEnv("LINKEDIN_CLIENT_ID") ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

export interface ExchangedToken {
  token: string;
  /** Seconds the token lasts, when LinkedIn says. */
  expiresIn: number | null;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<ExchangedToken | null> {
  const response = await fetch(`${OAUTH_URL}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: optionalEnv("LINKEDIN_CLIENT_ID") ?? "",
      client_secret: optionalEnv("LINKEDIN_CLIENT_SECRET") ?? "",
    }),
  });
  if (!response.ok) {
    console.error("[linkedin] token exchange failed:", await response.text());
    return null;
  }
  const body = await response.json();
  if (!body.access_token) return null;
  const expiresIn = Number(body.expires_in);
  return { token: body.access_token, expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : null };
}

const authorized = (token: string, extra: Record<string, string> = {}) => ({ headers: { Authorization: `Bearer ${token}`, ...extra } });

export async function fetchUserInfo(token: string): Promise<{ profile: LinkedInUserInfo } | { status: number }> {
  const response = await fetch(`${API_URL}/userinfo`, authorized(token));
  return response.ok ? { profile: await response.json() } : { status: response.status };
}

export const personUrn = (sub: string) => `urn:li:person:${sub}`;

export async function fetchAdministeredOrganizations(token: string): Promise<{ id: string; urn: string; name: string }[]> {
  const acls = await fetch(`${API_URL}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`, authorized(token));
  if (!acls.ok) return [];

  const organizations = [];
  for (const acl of (await acls.json()).elements ?? []) {
    const urn: string = acl.organization;
    const id = urn.split(":").pop()!;
    const details = await fetch(`${API_URL}/organizations/${id}`, authorized(token));
    if (details.ok) organizations.push({ id, urn, name: (await details.json()).localizedName || urn });
  }
  return organizations;
}

export async function fetchRecentPostTexts(token: string, externalId: string, count = 5): Promise<string[]> {
  const owner = externalId.startsWith("urn:li:") ? externalId : personUrn(externalId);
  const response = await fetch(
    `${API_URL}/shares?q=owners&owners=${encodeURIComponent(owner)}&count=${count}`,
    authorized(token, { "X-Restli-Protocol-Version": "2.0.0" })
  );
  if (!response.ok) return [];
  const elements: { text?: { text?: string }; commentary?: string }[] = (await response.json()).elements ?? [];
  return elements.map((item) => item.text?.text || item.commentary).filter((text): text is string => !!text && text.length > 30).map((text) => text.trim());
}

// Same version the publisher (n8n 03) posts with.
const LINKEDIN_VERSION = "202607";

export type DeletePostResult = { ok: true; alreadyGone?: true } | { ok: false; status: number };

/**
 * Deletes a post the member's token created (w_member_social). LinkedIn answers
 * 204; a 404 or 410 means the post is already gone, which is what was wanted.
 */
export async function deleteLinkedInPost(token: string, postUrn: string): Promise<DeletePostResult> {
  const response = await fetch(`https://api.linkedin.com/rest/posts/${encodeURIComponent(postUrn)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "X-RestLi-Method": "DELETE",
    },
  });
  if (response.ok) return { ok: true };
  if (response.status === 404 || response.status === 410) return { ok: true, alreadyGone: true };
  console.error("[linkedin] post delete failed:", response.status, await response.text().catch(() => ""));
  return { ok: false, status: response.status };
}
