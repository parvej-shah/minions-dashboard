import { prisma } from "@/lib/prisma";

/** How many of this tenant's ideas rest on each memory item. */
export async function usageCounts(clientId: string, ids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!ids.length) return counts;
  const ideas = await prisma.idea.findMany({
    where: { clientId, memoryIds: { hasSome: ids } },
    select: { memoryIds: true },
  });
  for (const idea of ideas) for (const id of idea.memoryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}
