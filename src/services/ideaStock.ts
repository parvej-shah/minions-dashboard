import { prisma } from "@/lib/prisma";
import { ideasToDiscard, UNUSED_IDEA_STATUSES } from "@/lib/ideaStock";

const DISCARD_REASON = "Made room for newer ideas (at most 10 wait at once).";

/** Discards the oldest unused ideas until `keep` remain. Returns how many went. */
export async function trimIdeaStock(clientId: string, keep: number): Promise<number> {
  const unused = await prisma.idea.findMany({
    where: {
      clientId,
      status: { in: UNUSED_IDEA_STATUSES },
      claimedAt: null,
      OR: [{ gateVerdict: null }, { gateVerdict: { not: "REJECT" } }],
    },
    select: { id: true, createdAt: true, memoryIds: true },
  });
  const ids = ideasToDiscard(unused, keep);
  if (!ids.length) return 0;
  const { count } = await prisma.idea.updateMany({
    where: { clientId, id: { in: ids }, status: { in: UNUSED_IDEA_STATUSES }, claimedAt: null },
    data: { status: "DISCARDED", rejectionReason: DISCARD_REASON },
  });
  return count;
}
