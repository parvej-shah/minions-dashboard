import { generateBrandDirectivesWithLLM, generateBrandSuggestionsWithLLM } from "@/lib/ai/brandCopilot";
import { generateSetupHints } from "@/lib/ai/setupHints";
import { checkRateLimit } from "@/lib/rate-limit";
import { templateDirectives } from "@/lib/ai/directiveTemplates";
import { fetchWebsiteContext } from "@/lib/ai/websiteContext";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

// A dead site only means less grounding, never a blocked request.
async function websiteSummary(url: string) {
  return url ? fetchWebsiteContext(url) : null;
}

export async function generateDirectives(body: JsonObject) {
  const industry = asString(body.industry) || "General Business";
  const businessName = asString(body.businessName) || "Our Brand";
  const audienceDescription = asString(body.audienceDescription);
  const contentFocus = asString(body.contentFocus);
  if (!audienceDescription || !contentFocus) {
    throw badRequest("Tell Minions what you want to be known for and who reads you, then try again.");
  }

  const differentiator = asString(body.differentiatorAnswer);
  const myth = asString(body.mythAnswer);
  const avoid = asString(body.avoidAnswer);
  const voiceSample = asString(body.voiceSample);
  const website = await websiteSummary(asString(body.websiteUrl));

  const generated = await generateBrandDirectivesWithLLM({
    businessName,
    industry,
    audienceDescription,
    contentFocus,
    mythAnswer: myth,
    differentiatorAnswer: differentiator,
    avoidAnswer: avoid,
    voiceSample,
    headline: asString(body.headline) || undefined,
    websiteContext: website?.summary,
    writerExpertiseGuidance: writerExpertisePromptGuidance(asString(body.writerExpertise)),
  });

  const { positioningSummary, directives } =
    generated ??
    templateDirectives({
      businessName,
      industry,
      contentFocus,
      differentiator,
      myth,
      avoid,
      voiceSample,
      selectedPresetId: asString(body.selectedPresetId),
    });
  return { success: true, businessName, industry, positioningSummary, directives };
}

export async function generateSuggestions(body: JsonObject) {
  const businessName = asString(body.businessName);
  const industry = asString(body.industry);
  if (!businessName || !industry) throw badRequest("businessName and industry are required");

  const website = await websiteSummary(asString(body.websiteUrl));
  const suggestions = await generateBrandSuggestionsWithLLM({ businessName, industry, websiteContext: website?.summary });

  // Name and industry were typed by the user, so unlike the LinkedIn path this input is genuinely personal; a fetched site leads the label.
  const groundedIn = website ? `${website.domain} · ${businessName} · ${industry}` : `${businessName} · ${industry}`;
  return { success: true, aiSuggestions: suggestions ? { ...suggestions, groundedIn } : null };
}

const HINTS_PER_MINUTE = 20;

/** The grey example for the next setup box, from the answers so far. Over the limit it is simply null: the fixed example stays. */
export async function suggestSetupHint(clientId: string, body: JsonObject) {
  const field = asString(body.field);
  if (field !== "audience" && field !== "story") throw badRequest("field must be audience or story");
  const { allowed } = await checkRateLimit(`setup-hint:${clientId}`, HINTS_PER_MINUTE, 60);
  if (!allowed) return { hint: null };
  const hint = await generateSetupHints({ field, contentFocus: asString(body.contentFocus), audienceDescription: asString(body.audienceDescription) });
  return { hint };
}
