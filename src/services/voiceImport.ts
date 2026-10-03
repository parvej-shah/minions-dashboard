import { prisma } from "@/lib/prisma";
import { generateBrandSuggestionsWithLLM } from "@/lib/ai/brandCopilot";
import { fetchWebsiteContext } from "@/lib/ai/websiteContext";
import { fetchRecentPostTexts, fetchUserInfo } from "@/lib/linkedin";
import { clearChannelCredential, readChannelToken } from "@/services/channels";
import { assertNotEstablished } from "@/services/onboardingGuard";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest, conflict, HttpError } from "@/server/http/errors";

const MIN_SAMPLE_LENGTH = 10;
const MAX_TONE_EXAMPLES = 3;
const SNIPPET_LENGTH = 160;
const DEFAULT_TONE_SEED =
  "Clear systems beat clever strategies every time. When you focus on operational discipline and measurable outcomes, growth becomes predictable.";

interface ImportedProfile {
  name: string;
  email: string;
  profilePicture: string | undefined;
}

async function loadProfile(token: string): Promise<{ profile: ImportedProfile; tokenExpired: boolean }> {
  const fallback: ImportedProfile = { name: "Executive", email: "", profilePicture: undefined };
  try {
    const result = await fetchUserInfo(token);
    if ("status" in result) {
      console.error("[VoiceImport] LinkedIn userinfo fetch failed:", result.status);
      return { profile: fallback, tokenExpired: result.status === 401 || result.status === 403 };
    }
    const { profile } = result;
    const name = `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || profile.name || fallback.name;
    return { profile: { name, email: profile.email || "", profilePicture: profile.picture || undefined }, tokenExpired: false };
  } catch (error) {
    console.error("[VoiceImport] LinkedIn userinfo fetch threw:", error);
    return { profile: fallback, tokenExpired: false };
  }
}

async function loadSamplePosts(token: string, externalId: string | null, pasted: string): Promise<string[]> {
  const posts = pasted.length > MIN_SAMPLE_LENGTH ? [pasted] : [];
  if (!externalId) return posts;
  try {
    return [...posts, ...(await fetchRecentPostTexts(token, externalId))];
  } catch (error) {
    console.warn("[VoiceImport] Post read skipped:", error);
    return posts;
  }
}

function sampleSource(pasted: string, samplePosts: string[]) {
  if (pasted.length > MIN_SAMPLE_LENGTH) return "MANUAL_PASTE";
  return samplePosts.length ? "LINKEDIN_IMPORT" : "DEFAULT_SEED";
}

export async function importLinkedInVoice(clientId: string, body: JsonObject) {
  await assertNotEstablished(clientId);
  const pastedSample = asString(body.customSampleText);
  const websiteUrl = asString(body.websiteUrl);

  const channel = await prisma.clientChannel.findUnique({ where: { clientId_channelKey: { clientId, channelKey: "linkedin" } } });
  if (!channel?.credentialRef) throw badRequest("No LinkedIn account connected yet. Please connect LinkedIn first.");

  const token = await readChannelToken(channel.credentialRef).catch(() => null);
  if (!token) throw new HttpError(500, "Failed to retrieve LinkedIn token from vault.");

  const { profile, tokenExpired } = await loadProfile(token);
  if (tokenExpired) {
    await clearChannelCredential(clientId, "linkedin");
    // 409, not 401: apiClient treats any 401 as this app's own session expiring and redirects to /login.
    throw conflict("Your LinkedIn connection has expired. Please reconnect your LinkedIn account.");
  }

  const samplePosts = await loadSamplePosts(token, channel.externalId, pastedSample);
  const hasSampleText = samplePosts.length > 0;

  await prisma.toneExample.deleteMany({ where: { clientId } });
  await prisma.toneExample.createMany({
    data: (hasSampleText ? samplePosts : [DEFAULT_TONE_SEED])
      .slice(0, MAX_TONE_EXAMPLES)
      .map((content) => ({ clientId, content, source: sampleSource(pastedSample, samplePosts) })),
  });

  // Headline and company are not fetched: LinkedIn's /v2/me needs a scope this app cannot obtain, and a fabricated persona is worse than none.
  const website = websiteUrl ? await fetchWebsiteContext(websiteUrl) : null;
  const suggestions = await generateBrandSuggestionsWithLLM({
    businessName: profile.name,
    industry: "",
    postSamples: samplePosts,
    websiteContext: website?.summary,
  });

  // A name alone is a mail-merge field, not personalization: only claim grounding when real writing or a real site backed the output.
  const grounding = [website?.domain, hasSampleText ? "your LinkedIn writing sample" : null].filter((part): part is string => !!part);
  return {
    success: true,
    profile,
    importedCount: samplePosts.length,
    postSnippet: hasSampleText ? samplePosts[0].slice(0, SNIPPET_LENGTH) : null,
    isRealPostImported: hasSampleText,
    aiSuggestions: suggestions ? { ...suggestions, groundedIn: grounding.length ? grounding.join(" · ") : undefined } : null,
  };
}
