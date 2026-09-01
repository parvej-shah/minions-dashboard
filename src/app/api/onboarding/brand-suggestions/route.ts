import { NextResponse } from "next/server";
import { requireTenantAccess } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";
import { generateBrandSuggestionsWithLLM } from "@/lib/ai/brandCopilot";
import { fetchWebsiteContext } from "@/lib/ai/websiteContext";

/**
 * Personalizes the Brand Interview suggestion chips (Step 2) for users who
 * skip LinkedIn connection -- the majority path, since that step is OAuth.
 * Without this, those users always saw the static INDUSTRY_SUGGESTIONS map
 * regardless of what they typed in Step 1. Returns `aiSuggestions: null` on
 * any failure so the caller falls back to that static map, same as the
 * LinkedIn-connected path already does.
 */
export async function POST(request: Request) {
  const ctx = await requireTenantAccess(true);
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json().catch(() => ({}));
    const businessName = (body.businessName || "").toString().trim();
    const industry = (body.industry || "").toString().trim();
    const websiteUrl = (body.websiteUrl || "").toString().trim();

    if (!businessName || !industry) {
      return apiFailure("businessName and industry are required", 400);
    }

    // Best-effort: a dead site or fetch failure just means less grounding,
    // never a blocked request.
    const website = websiteUrl ? await fetchWebsiteContext(websiteUrl) : null;

    const rawSuggestions = await generateBrandSuggestionsWithLLM({
      businessName,
      industry,
      websiteContext: website?.summary,
    });
    // businessName + industry here were typed by the user in Step 1, so
    // unlike the LinkedIn-import path this genuinely is personalized input;
    // a successful site fetch is an even stronger signal, so it leads the label.
    const groundedIn = website ? `${website.domain} · ${businessName} · ${industry}` : `${businessName} · ${industry}`;
    const aiSuggestions = rawSuggestions ? { ...rawSuggestions, groundedIn } : null;
    return NextResponse.json({ success: true, aiSuggestions });
  } catch (error) {
    return apiError(error, "Failed to generate brand suggestions");
  }
}
