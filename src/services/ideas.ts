import type { Idea, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Inserts an idea under the next global IDEA-#### id, or returns null when no
 * id could be allocated.
 *
 * IDEA-#### ids are global, not per-tenant, so the highest number has to be
 * read across every tenant. Reading it and inserting in two steps races: two
 * injects landing together compute the same number and the second dies on a
 * primary-key collision, which surfaced as "I saved my idea and it vanished".
 * Retry on that collision rather than widening this into a table lock -- the
 * window is tiny and a handful of attempts closes it.
 */
export async function createIdeaWithNextId(data: Omit<Prisma.IdeaUncheckedCreateInput, "id">): Promise<Idea | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const highest = await prisma.idea.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const parsed = Number.parseInt((highest?.id ?? "").replace(/\D/g, ""), 10);
    const nextNumber = (Number.isFinite(parsed) ? parsed : 0) + 1 + attempt;
    try {
      return await prisma.idea.create({ data: { ...data, id: `IDEA-${String(nextNumber).padStart(4, "0")}` } });
    } catch (err) {
      const isIdCollision = typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
      if (!isIdCollision) throw err;
    }
  }
  return null;
}
