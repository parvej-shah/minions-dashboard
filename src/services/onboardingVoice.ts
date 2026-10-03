import { prisma } from "@/lib/prisma";
import { DEFAULT_PALETTE } from "@/constants/brand";
import { assertNotEstablished } from "@/services/onboardingGuard";
import type { JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

const MAX_EXAMPLES = 5;

export async function saveVoiceProfile(clientId: string, body: JsonObject) {
  await assertNotEstablished(clientId);

  const toneQuestionnaire = (body.tone_questionnaire ?? null) as never;
  const examples = Array.isArray(body.examples) ? body.examples.map((item) => String(item || "").trim()).filter(Boolean) : [];
  if (examples.length > MAX_EXAMPLES) throw badRequest(`Provide up to ${MAX_EXAMPLES} example posts`);

  await prisma.brandProfile.upsert({
    where: { clientId },
    update: { toneQuestionnaire },
    create: {
      clientId,
      brandName: "",
      companyDomain: "",
      positioning: "",
      primaryLogoUrl: "",
      ...DEFAULT_PALETTE,
      toneFormality: "conversational_peer",
      toneCadence: "1-3 sentence paragraphs, plain language, no filler.",
      toneQuestionnaire,
    },
  });

  if (examples.length > 0) {
    await prisma.toneExample.deleteMany({ where: { clientId } });
    await prisma.toneExample.createMany({ data: examples.map((content) => ({ clientId, content, source: "onboarding" })) });
  }
  return { success: true, examples_saved: examples.length };
}
