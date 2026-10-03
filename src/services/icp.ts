import { prisma } from "@/lib/prisma";
import { toIcpDTO } from "@/lib/mappers/author";
import { parseIcpInput } from "@/lib/authorInput";
import { syncIcpDirective } from "@/lib/icpDirective";
import { ensureAuthorDefaults } from "@/services/authorContext";
import { badRequest } from "@/server/http/errors";

export async function getIcp(clientId: string) {
  await ensureAuthorDefaults(clientId);
  return toIcpDTO(await prisma.icpProfile.findUnique({ where: { clientId } }));
}

export async function saveIcp(clientId: string, input: unknown) {
  const icp = parseIcpInput(input);
  if ("error" in icp) throw badRequest(icp.error);

  const data = {
    who: icp.who,
    role: icp.role,
    companyType: icp.company_type,
    pains: icp.pains,
    decisions: icp.decisions,
    questions: icp.questions,
    buyingTriggers: icp.buying_triggers,
    vocabulary: icp.vocabulary,
  };
  const row = await prisma.icpProfile.upsert({
    where: { clientId },
    create: { id: `ICP-${clientId}`, clientId, ...data },
    update: data,
  });
  // The prompts learn the audience from AUDIENCE directives, so every save rewrites the profile as that directive.
  await syncIcpDirective(clientId, icp);
  return toIcpDTO(row);
}
