import { prisma } from "@/lib/prisma";

/** A workspace that never saved its brand brief has nothing for the harvest quality gate to judge against. */
export async function isHarvestReady(clientId: string): Promise<boolean> {
  const profile = await prisma.brandProfile.findUnique({ where: { clientId }, select: { positioning: true } });
  return Boolean(profile?.positioning?.trim());
}
