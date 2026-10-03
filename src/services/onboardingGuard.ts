import { prisma } from "@/lib/prisma";
import { conflict } from "@/server/http/errors";

// Onboarding rewrites a brand wholesale, which would destroy an established workspace (it did to tenant zero on 2026-08-29).
// A workspace is established once it has ideas, assets or a posting schedule; the first onboarding has none of these.
export async function isEstablishedTenant(clientId: string): Promise<boolean> {
  const [idea, asset, schedule] = await Promise.all([
    prisma.idea.findFirst({ where: { clientId }, select: { id: true } }),
    prisma.asset.findFirst({ where: { clientId }, select: { id: true } }),
    prisma.postingSchedule.findFirst({ where: { clientId }, select: { id: true } }),
  ]);
  return Boolean(idea || asset || schedule);
}

const ESTABLISHED_TENANT_MESSAGE =
  "This workspace is already set up. Running onboarding again would overwrite its brand, so change it in Brand settings instead.";

export async function assertNotEstablished(clientId: string): Promise<void> {
  if (await isEstablishedTenant(clientId)) throw conflict(ESTABLISHED_TENANT_MESSAGE);
}
