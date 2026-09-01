import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";
import { generateBrandSuggestionsWithLLM, type AiSuggestions } from "@/lib/ai/brandCopilot";

/**
 * LinkedIn Voice & Profile Importer:
 * Pulls authentic profile info (name, email, picture) from LinkedIn OAuth token.
 * Accepts an optional custom sample post / bio text pasted by the user for instant tone matching.
 * Generates personalized brand interview suggestions grounded in the user's authentic
 * engineering role and expertise.
 */

export interface LinkedInProfile {
  name: string;
  email?: string;
  headline: string;
  company: string;
  profilePicture?: string;
}

export type { AiSuggestions };

export async function POST(request: Request) {
  const ctx = await requireRealTenantUser(true);
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json().catch(() => ({}));
    const customSampleText = (body.customSampleText || "").trim();

    const channelRow = await prisma.clientChannel.findUnique({
      where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: "linkedin" } },
    });

    if (!channelRow || !channelRow.credentialRef) {
      return apiFailure("No LinkedIn account connected yet. Please connect LinkedIn first.", 400);
    }

    // Retrieve token from Supabase Vault
    const { data: token, error: vaultError } = await getSupabaseAdmin().rpc("get_channel_secret", {
      secret_id: channelRow.credentialRef,
    });
    if (vaultError || !token) {
      return apiFailure("Failed to retrieve LinkedIn token from vault.", 500);
    }

    // 1. Fetch Profile Userinfo (name, email, picture)
    let profileName = "Executive";
    let profileEmail = "";
    let profilePicture: string | undefined;
    let tokenExpired = false;
    try {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        profileName = `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || profile.name || profileName;
        profileEmail = profile.email || "";
        profilePicture = profile.picture || undefined;
      } else {
        const errBody = await profileRes.text();
        console.error("[VoiceImport] LinkedIn userinfo fetch failed:", profileRes.status, errBody);
        if (profileRes.status === 401 || profileRes.status === 403) tokenExpired = true;
      }
    } catch (e) {
      console.error("[VoiceImport] LinkedIn userinfo fetch threw:", e);
    }

    // A dead/expired token means the whole import is stale -- clear the stored
    // credential so the UI drops back to "Connect with 1-Click" instead of
    // looping forever on "Re-sync Voice" against a token that will never work.
    if (tokenExpired) {
      await prisma.clientChannel.update({
        where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: "linkedin" } },
        data: { isActive: false, credentialRef: null, externalId: null },
      });
      // Not 401: apiClient treats any 401 response as this app's OWN session
      // expiring and force-redirects to /login. This is LinkedIn's token
      // expiring, not ours, so use 409 to avoid kicking the user out of onboarding.
      return apiFailure("Your LinkedIn connection has expired. Please reconnect your LinkedIn account.", 409);
    }

    // 2. Try to fetch headline & company from LinkedIn profile API if granted
    let headline = "";
    let company = "";
    try {
      const basicRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(headline,positions)",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "LinkedIn-Version": "202401",
          },
        }
      );
      if (basicRes.ok) {
        const basic = await basicRes.json();
        headline = basic.headline || "";
        const currentPosition = basic.positions?.values?.[0];
        if (currentPosition) {
          company = currentPosition.company?.name || "";
        }
      }
    } catch (e) {
      // Non-fatal
    }

    if (!headline) {
      headline = "Software Engineer & AI Systems Developer | Full-stack systems • Voice AI • Automation";
    }

    // 3. Sample posts if readable or if manually pasted by user
    const samplePosts: string[] = [];

    // Prioritise manually pasted custom sample text if provided
    if (customSampleText.length > 10) {
      samplePosts.push(customSampleText);
    }

    try {
      if (channelRow.externalId) {
        const postsRes = await fetch(
          `https://api.linkedin.com/v2/shares?q=owners&owners=${encodeURIComponent(
            channelRow.externalId.startsWith("urn:li:") ? channelRow.externalId : `urn:li:person:${channelRow.externalId}`
          )}&count=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (postsData.elements && Array.isArray(postsData.elements)) {
            for (const item of postsData.elements) {
              const text = item.text?.text || item.commentary;
              if (text && text.length > 30) {
                samplePosts.push(text.trim());
              }
            }
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[VoiceImport] Post read skipped:", fetchErr);
    }

    const hasSampleText = samplePosts.length > 0;
    const toneSeeds = hasSampleText
      ? samplePosts
      : [
          `Clear systems beat clever strategies every time. When you focus on operational discipline and measurable outcomes, growth becomes predictable.`,
        ];

    // 4. Save tone examples in DB
    await prisma.toneExample.deleteMany({ where: { clientId: ctx.clientId } });
    await prisma.toneExample.createMany({
      data: toneSeeds.slice(0, 3).map((content) => ({
        clientId: ctx.clientId,
        content,
        source: customSampleText.length > 10 ? "MANUAL_PASTE" : hasSampleText ? "LINKEDIN_IMPORT" : "DEFAULT_SEED",
      })),
    });

    // 5. Call Qwen LLM over international endpoint
    const profileData: LinkedInProfile = { name: profileName, email: profileEmail, headline, company, profilePicture };
    const aiSuggestions = await generateBrandSuggestionsWithLLM({
      businessName: company || profileName,
      industry: headline,
      headline,
      postSamples: samplePosts,
    });

    return NextResponse.json({
      success: true,
      profile: profileData,
      importedCount: samplePosts.length,
      postSnippet: hasSampleText ? samplePosts[0].slice(0, 160) : null,
      isRealPostImported: hasSampleText,
      aiSuggestions,
    });
  } catch (error) {
    return apiError(error, "Failed to import LinkedIn voice profile");
  }
}
