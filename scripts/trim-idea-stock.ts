/**
 * One-off (2026-10-28): bring every workspace down to IDEA_CAP unused ideas,
 * discarding outside ideas before the author's own, oldest first. Dry run by
 * default; --apply writes.
 *
 *   npm run ideas:trim
 *   npm run ideas:trim -- --apply
 */
import { prisma } from "@/lib/prisma";
import { IDEA_CAP, ideasToDiscard, UNUSED_IDEA_STATUSES } from "@/lib/ideaStock";
import { trimIdeaStock } from "@/services/ideaStock";

(async () => {
  const apply = process.argv.includes("--apply");
  const unused = await prisma.idea.findMany({
    where: { status: { in: UNUSED_IDEA_STATUSES }, claimedAt: null, OR: [{ gateVerdict: null }, { gateVerdict: { not: "REJECT" } }] },
    select: { id: true, clientId: true, createdAt: true, memoryIds: true },
  });
  const byClient = new Map<string, typeof unused>();
  for (const i of unused) if (i.clientId) byClient.set(i.clientId, [...(byClient.get(i.clientId) ?? []), i]);

  let total = 0;
  for (const [clientId, ideas] of byClient) {
    const extra = ideasToDiscard(ideas, IDEA_CAP).length;
    if (!extra) continue;
    const done = apply ? await trimIdeaStock(clientId, IDEA_CAP) : extra;
    total += done;
    console.log(`${clientId}: ${ideas.length} unused -> ${ideas.length - done} (${apply ? "discarded" : "would discard"} ${done})`);
  }
  console.log(`${apply ? "Discarded" : "Would discard"} ${total} idea(s).${apply ? "" : " Dry run; add --apply to write."}`);
  await prisma.$disconnect();
})();
