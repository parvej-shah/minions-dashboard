import { prisma } from "@/lib/prisma";
import type { IcpContext } from "@/services/authorContext";
import { icpBuyer } from "@/constants/contentLanes";

/**
 * The ICP, written as the one AUDIENCE directive the current prompts read.
 *
 * Until the phase 3/4 prompts read `icp` from the brand context directly, the
 * harvest, strategist and writer prompts learn the audience from AUDIENCE
 * directives. So the ICP profile is the source of truth and this directive is
 * derived from it on every save -- editing one place changes both.
 */
const ICP_DIRECTIVE_KEY = "icp_profile";

function icpDirectiveId(clientId: string): string {
  return `DIR-ICP-${clientId}`;
}

const list = (label: string, items: string[]) => (items.length ? `${label}: ${items.join("; ")}.` : "");

const BUYER_LINE = {
  OUTCOME: "They buy the outcome, not the technology: lead with what changes for them and keep how it works to one plain sentence.",
  TECHNICAL: "They are technical buyers: they want to know how it works, so technical depth is welcome.",
} as const;

export function renderIcpDirective(icp: IcpContext): string {
  const who = [icp.who, icp.role && `Role: ${icp.role}.`, icp.company_type && `Company: ${icp.company_type}.`]
    .filter(Boolean)
    .join(" ");
  const body = [
    who,
    list("Their pains", icp.pains),
    list("Decisions they are making", icp.decisions),
    list("Questions they ask", icp.questions),
    list("What makes them act", icp.buying_triggers),
    list("Words they use", icp.vocabulary),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  // Only a profile with something in it gets a directive at all.
  return body ? `${body} ${BUYER_LINE[icpBuyer(icp)]}` : "";
}

/**
 * Rewrites the derived directive and retires the tenant's other AUDIENCE
 * directives, which the ICP was seeded from (deactivated, never deleted), so
 * the prompts see one audience, not the old tags plus the profile.
 */
export async function syncIcpDirective(clientId: string, icp: IcpContext): Promise<void> {
  const id = icpDirectiveId(clientId);
  const instruction = renderIcpDirective(icp);
  await prisma.$transaction([
    prisma.brandDirective.updateMany({
      where: { clientId, category: "AUDIENCE", isActive: true, id: { not: id } },
      data: { isActive: false },
    }),
    instruction
      ? prisma.brandDirective.upsert({
          where: { id },
          create: { id, clientId, category: "AUDIENCE", ruleKey: ICP_DIRECTIVE_KEY, instruction, priority: 1, audienceScope: "ICP", isActive: true },
          update: { instruction, isActive: true },
        })
      : prisma.brandDirective.updateMany({ where: { id }, data: { isActive: false } }),
  ]);
}
