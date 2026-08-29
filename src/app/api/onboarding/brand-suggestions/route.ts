import { NextResponse } from "next/server";
import { requireRealTenantUser } from "@/lib/tenant";
import { apiError, apiFailure } from "@/lib/api-response";
import { generateBrandSuggestionsWithLLM } from "@/lib/ai/brandCopilot";

/**
 * Personalizes the Brand Interview suggestion chips (Step 2) for users who
 * skip LinkedIn connection -- the majority path, since that step is OAuth.
 * Without this, those users always saw the static INDUSTRY_SUGGESTIONS map
 * regardless of what they typed in Step 1. Returns `aiSuggestions: null` on
 * any failure so the caller falls back to that static map, same as the
 * LinkedIn-connected path already does.
 */
export async function POST(request: Request) {
  const ctx = await requireRealTenantUser(true);
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json().catch(() => ({}));
    const businessName = (body.businessName || "").toString().trim();
    const industry = (body.industry || "").toString().trim();

    if (!businessName || !industry) {
      return apiFailure("businessName and industry are required", 400);
    }

    const aiSuggestions = await generateBrandSuggestionsWithLLM({ businessName, industry });
    return NextResponse.json({ success: true, aiSuggestions });
  } catch (error) {
    return apiError(error, "Failed to generate brand suggestions");
  }
}
