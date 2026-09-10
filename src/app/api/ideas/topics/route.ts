import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { resolveTopics } from "@/constants/topics";

/**
 * The topic labels this tenant files ideas under.
 *
 * These replace the hardcoded HVAC / Plumbing / Electrical / Roofing / Pest
 * Control list that every tenant saw regardless of industry. They come from the
 * tenant's own `core_themes` directive, which onboarding already collects, plus
 * any label already stored on their ideas so nothing in the stream becomes
 * unfilterable when the operator edits their themes.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const [themes, used] = await Promise.all([
      prisma.brandDirective.findFirst({
        where: { clientId: ctx.clientId, ruleKey: "core_themes", isActive: true },
        select: { instruction: true },
      }),
      prisma.idea.findMany({
        where: { clientId: ctx.clientId, NOT: { targetTrade: "" } },
        select: { targetTrade: true },
        distinct: ["targetTrade"],
      }),
    ]);

    return NextResponse.json({
      topics: resolveTopics(
        themes?.instruction,
        used.map((row) => row.targetTrade)
      ),
    });
  } catch (error) {
    return apiError(error, "Failed to load topics");
  }
}
