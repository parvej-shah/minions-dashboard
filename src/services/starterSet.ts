import { prisma } from "@/lib/prisma";
import { pickStarterSet, STARTER_TAG } from "@/lib/starterSet";
import { startDraftRun } from "@/services/drafting";
import { createIdeaWithNextId } from "@/services/ideas";

const DRAFTABLE_STATUSES = ["HARVESTED", "REFINED", "QUEUED"];
const TRIGGER_SOURCE = "ONBOARDING_STARTER_SET";

/**
 * A new workspace opens with three posts, not one: the first (from the story
 * typed in setup) plus two drafted from other angles, left for review.
 * Runs once per workspace (the tag marks it) and never throws, so it cannot
 * hurt the first post.
 */
export async function startStarterSet(clientId: string, firstIdeaId: string): Promise<{ started: number }> {
  try {
    if (await prisma.idea.findFirst({ where: { clientId, tags: { has: STARTER_TAG } }, select: { id: true } })) return { started: 0 };

    const [first, pool] = await Promise.all([
      prisma.idea.findUnique({
        where: { id: firstIdeaId },
        select: { rawIdea: true, memoryIds: true, sourceType: true, trustBasis: true },
      }),
      prisma.idea.findMany({
        where: { clientId, id: { not: firstIdeaId }, status: { in: DRAFTABLE_STATUSES }, draftAssetId: null, claimedAt: null },
        select: { id: true, laneId: true, gateVerdict: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    if (!first) return { started: 0 };

    let started = 0;
    for (const pick of pickStarterSet(pool, first.sourceType)) {
      try {
        let ideaId: string;
        if (pick.kind === "EXISTING") {
          ideaId = pick.ideaId;
          await prisma.idea.update({ where: { id: ideaId }, data: { tags: { push: STARTER_TAG } } });
        } else {
          const created = await createIdeaWithNextId({
            clientId,
            rawIdea: first.rawIdea,
            angle: pick.role.brief,
            pillar: pick.role.pillar,
            source: "MANUAL",
            status: "REFINED",
            sourceType: pick.sourceType,
            trustBasis: pick.role.keepsStory ? first.trustBasis : [],
            memoryIds: pick.role.keepsStory ? first.memoryIds : [],
            recommendedFormat: "POST",
            profileTarget: "PERSONAL",
            gateVerdict: "PASS",
            tags: [STARTER_TAG],
          });
          if (!created) continue;
          ideaId = created.id;
        }
        await startDraftRun(clientId, ideaId, { triggerSource: TRIGGER_SOURCE });
        started++;
      } catch (error) {
        console.warn("[starter-set] one extra post did not start:", error instanceof Error ? error.message : error);
      }
    }
    return { started };
  } catch (error) {
    console.warn("[starter-set] skipped:", error instanceof Error ? error.message : error);
    return { started: 0 };
  }
}
