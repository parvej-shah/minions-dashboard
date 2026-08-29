import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";

/**
 * LinkedIn Voice & Profile Importer (Enhanced):
 * Pulls profile info, headline, company, and post history.
 * Generates personalised brand interview suggestions using LLM (DashScope/Qwen)
 * or falls back to smart preset-based suggestions if key is unavailable.
 */

export interface LinkedInProfile {
  name: string;
  headline: string;
  company: string;
  profilePicture?: string;
}

export interface AiSuggestions {
  myths: string[];
  differentiators: string[];
  avoids: string[];
}

async function generateSuggestionsWithLLM(
  profile: LinkedInProfile,
  postSamples: string[]
): Promise<AiSuggestions | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const postsContext =
    postSamples.length > 0
      ? postSamples.slice(0, 3).map((p, i) => `Post ${i + 1}: "${p.slice(0, 300)}"`).join("\n")
      : "No posts available.";

  const prompt = `You are a brand voice strategist. Based on this LinkedIn professional's profile and sample posts, generate 3 tailored suggestions for each of these brand interview questions. Return ONLY valid JSON.

Profile:
- Name: ${profile.name}
- Headline: ${profile.headline || "Executive / Professional"}
- Company: ${profile.company || "Their Company"}

Sample LinkedIn Posts:
${postsContext}

Return this exact JSON structure (no markdown, no explanation):
{
  "myths": ["myth suggestion 1", "myth suggestion 2", "myth suggestion 3"],
  "differentiators": ["differentiator 1", "differentiator 2", "differentiator 3"],
  "avoids": ["avoid topic 1", "avoid topic 2", "avoid topic 3"]
}

Where:
- myths = common misconceptions or bad advice in their industry they likely disagree with, based on their post style
- differentiators = what makes them or their company uniquely valuable, inferred from posts
- avoids = topics, claims, or content styles they should steer clear of based on their professional voice`;

  try {
    const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(cleaned);
    if (
      Array.isArray(parsed.myths) &&
      Array.isArray(parsed.differentiators) &&
      Array.isArray(parsed.avoids)
    ) {
      return parsed as AiSuggestions;
    }
    return null;
  } catch (e) {
    console.warn("[VoiceImport] LLM suggestion generation failed:", e);
    return null;
  }
}

export async function POST(request: Request) {
  const ctx = await requireRealTenantUser(true);
  if ("error" in ctx) return ctx.error;

  try {
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

    // 1. Fetch Profile Userinfo (name, picture)
    let profileName = "Executive";
    let profilePicture: string | undefined;
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profileRes.ok) {
      const profile = await profileRes.json();
      profileName = `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || profileName;
      profilePicture = profile.picture || undefined;
    }

    // 2. Try to get headline + company from LinkedIn profile API
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
      // Non-fatal — headline / company just won't auto-fill
    }

    // 3. Fetch recent posts
    const importedExamples: string[] = [];
    try {
      if (channelRow.externalId) {
        const postsRes = await fetch(
          `https://api.linkedin.com/rest/posts?author=${encodeURIComponent(channelRow.externalId)}&q=author&count=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "LinkedIn-Version": "202401",
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (postsData.elements && Array.isArray(postsData.elements)) {
            for (const item of postsData.elements) {
              const text = item.commentary || item.text?.text;
              if (text && text.length > 40) {
                importedExamples.push(text.trim());
              }
            }
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[VoiceImport] LinkedIn post read skipped/failed:", fetchErr);
    }

    // 4. If no posts extracted, add a quality default seed
    if (importedExamples.length === 0) {
      importedExamples.push(
        `Clear systems beat clever strategies every time. When you focus on operational discipline and measurable outcomes, growth becomes predictable.`
      );
    }

    // 5. Save tone examples to DB
    await prisma.toneExample.deleteMany({ where: { clientId: ctx.clientId } });
    await prisma.toneExample.createMany({
      data: importedExamples.slice(0, 3).map((content) => ({
        clientId: ctx.clientId,
        content,
        source: "LINKEDIN_IMPORT",
      })),
    });

    // 6. Generate AI suggestions from post content + profile
    const profileData: LinkedInProfile = { name: profileName, headline, company, profilePicture };
    const aiSuggestions = await generateSuggestionsWithLLM(profileData, importedExamples);

    return NextResponse.json({
      success: true,
      profile: profileData,
      importedCount: importedExamples.length,
      postSnippet: importedExamples[0]?.slice(0, 160) || null,
      aiSuggestions, // null if LLM not configured — client falls back to preset chips
    });
  } catch (error) {
    return apiError(error, "Failed to import LinkedIn voice profile");
  }
}
