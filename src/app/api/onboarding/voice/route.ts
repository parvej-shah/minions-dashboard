import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { refuseOnboardingOverwrite } from "@/lib/onboardingGuard";

/**
 * Voice-test step: structured questionnaire + 1-5 pasted example posts.
 * Both feed the Writer prompt in 02_idea_to_asset as few-shot context (see
 * Build Writer Payload's tone_examples / tone_questionnaire injection).
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  // Onboarding rewrites the whole brand; never let it run over an established workspace.
  const refused = await refuseOnboardingOverwrite(ctx.clientId);
  if (refused) return refused;

  try {
    const body = await request.json();
    const toneQuestionnaire = body.tone_questionnaire ?? null;
    const examples: string[] = Array.isArray(body.examples)
      ? body.examples.map((e: unknown) => (e || "").toString().trim()).filter(Boolean)
      : [];

    if (examples.length > 5) {
      return apiFailure("Provide up to 5 example posts", 400);
    }

    await prisma.brandProfile.upsert({
      where: { clientId: ctx.clientId },
      update: { toneQuestionnaire },
      create: {
        clientId: ctx.clientId,
        brandName: "",
        companyDomain: "",
        positioning: "",
        primaryLogoUrl: "",
        primaryInk: "#12242A",
        brandTeal: "#0E5C63",
        brandCoral: "#FF6B4A",
        brandCream: "#FFF8F0",
        accentBlue: "#3A6EA5",
        toneFormality: "conversational_peer",
        toneCadence: "1-3 sentence paragraphs, plain language, no filler.",
        toneQuestionnaire,
      },
    });

    if (examples.length > 0) {
      await prisma.toneExample.deleteMany({ where: { clientId: ctx.clientId } });
      await prisma.toneExample.createMany({
        data: examples.map((content) => ({ clientId: ctx.clientId, content, source: "onboarding" })),
      });
    }

    return NextResponse.json({ success: true, examples_saved: examples.length });
  } catch (error) {
    return apiError(error, "Failed to save voice profile");
  }
}
