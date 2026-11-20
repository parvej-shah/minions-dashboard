import { prisma } from "@/lib/prisma";
import { fetchUserInfo } from "@/lib/linkedin";
import { checkIsDue, linkedinConfig, linkedinHealth, type LinkedInHealth } from "@/lib/linkedinHealth";
import { readChannelToken } from "@/services/channels";

const channelRow = (clientId: string) =>
  prisma.clientChannel.findUnique({ where: { clientId_channelKey: { clientId, channelKey: "linkedin" } }, select: { isActive: true, credentialRef: true, config: true } });

export async function getLinkedInHealth(clientId: string, now: Date = new Date()): Promise<LinkedInHealth> {
  return linkedinHealth(await channelRow(clientId), now);
}

/**
 * The cheap live check (task 109): one profile call with the stored token. A 401
 * or 403 means LinkedIn refused it, so the connection is marked expired; a good
 * answer clears that. Network or vault errors change nothing: not knowing is not
 * a lapse. Runs at most once a day per workspace.
 */
export async function checkLinkedInConnection(clientId: string, now: Date = new Date()): Promise<LinkedInHealth> {
  const row = await channelRow(clientId);
  if (!row || !checkIsDue(row, now)) return linkedinHealth(row, now);
  try {
    const token = await readChannelToken(row.credentialRef!);
    if (!token) return linkedinHealth(row, now);
    const result = await fetchUserInfo(token);
    const config = { ...linkedinConfig(row), checkedAt: now.toISOString() } as Record<string, string | undefined>;
    if ("profile" in result) delete config.rejectedAt;
    else if (result.status === 401 || result.status === 403) config.rejectedAt = now.toISOString();
    else return linkedinHealth(row, now);
    await prisma.clientChannel.update({ where: { clientId_channelKey: { clientId, channelKey: "linkedin" } }, data: { config } });
    return linkedinHealth({ ...row, config }, now);
  } catch (error) {
    console.warn(`[linkedin] health check failed for ${clientId}:`, error);
    return linkedinHealth(row, now);
  }
}
