import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";

/**
 * LinkedIn Voice & Profile Importer (Enhanced & Personalised):
 * Pulls profile info, email, picture, and post history.
 * Generates personalized brand interview suggestions & infers brand/business name
 * using Qwen LLM over international DashScope endpoint.
 */

export interface LinkedInProfile {
  name: string;
  email?: string;
  headline: string;
  company: string;
  profilePicture?: string;
}

export interface AiSuggestions {
  inferredBusinessName?: string;
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
      : "No post history available.";

  const prompt = `You are a world-class executive brand strategist calibrating a personalized content engine for an executive during onboarding.

Professional Profile:
- Name: ${profile.name}
- Email: ${profile.email || "N/A"}
- Headline: ${profile.headline || "Tech Leader / Founder"}
- Company: ${profile.company || "N/A"}

Sample Content / Posts:
${postsContext}

Task:
1. Infer or recommend a sharp, professional Business/Brand Name for this executive (e.g. "Brain Station 23", "${profile.name.split(" ")[0]} Tech", "Minions AI", etc.).
2. Generate 3 highly specific, contrarian myth/misconception suggestions in their industry that they disagree with.
3. Generate 3 highly specific #1 differentiator suggestions (why clients hire them / what makes their execution unique).
4. Generate 3 strict content boundary / topic avoid suggestions.

Return ONLY a single valid JSON object (no markdown, no code block):
{
  "inferredBusinessName": "string",
  "myths": ["myth 1", "myth 2", "myth 3"],
  "differentiators": ["diff 1", "diff 2", "diff 3"],
  "avoids": ["avoid 1", "avoid 2", "avoid 3"]
}`;

  try {
    const res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
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

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[VoiceImport] LLM non-200 response:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

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

    // 1. Fetch Profile Userinfo (name, email, picture)
    let profileName = "Executive";
    let profileEmail = "";
    let profilePicture: string | undefined;
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profileRes.ok) {
      const profile = await profileRes.json();
      profileName = `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || profile.name || profileName;
      profileEmail = profile.email || "";
      profilePicture = profile.picture || undefined;
    }

    // 2. Try to fetch headline & company if permissions allow
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

    // 3. Sample posts if readable
    const importedExamples: string[] = [];
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
                importedExamples.push(text.trim());
              }
            }
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[VoiceImport] Post read skipped:", fetchErr);
    }

    // 4. Default seed if no posts extracted
    if (importedExamples.length === 0) {
      importedExamples.push(
        `Clear systems beat clever strategies every time. When you focus on operational discipline and measurable outcomes, growth becomes predictable.`
      );
    }

    // 5. Save tone examples in DB
    await prisma.toneExample.deleteMany({ where: { clientId: ctx.clientId } });
    await prisma.toneExample.createMany({
      data: importedExamples.slice(0, 3).map((content) => ({
        clientId: ctx.clientId,
        content,
        source: "LINKEDIN_IMPORT",
      })),
    });

    // 6. Call Qwen LLM over international endpoint
    const profileData: LinkedInProfile = { name: profileName, email: profileEmail, headline, company, profilePicture };
    const aiSuggestions = await generateSuggestionsWithLLM(profileData, importedExamples);

    // If company was extracted or inferred by AI, update profileData.company
    if (!profileData.company && aiSuggestions?.inferredBusinessName) {
      profileData.company = aiSuggestions.inferredBusinessName;
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
      importedCount: importedExamples.length,
      postSnippet: importedExamples[0]?.slice(0, 160) || null,
      aiSuggestions,
    });
  } catch (error) {
    return apiError(error, "Failed to import LinkedIn voice profile");
  }
}
