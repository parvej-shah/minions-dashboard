import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import { ensureAuthorDefaults } from "@/services/authorContext";
import { toIcpDTO } from "@/lib/mappers/author";
import { parseIcpInput } from "@/lib/authorInput";
import { syncIcpDirective } from "@/lib/icpDirective";

/** The one ICP this workspace writes for (decision D2). */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    await ensureAuthorDefaults(ctx.clientId);
    const row = await prisma.icpProfile.findUnique({ where: { clientId: ctx.clientId } });
    return NextResponse.json(toIcpDTO(row));
  } catch (error) {
    return apiError(error, "Failed to load your ideal customer");
  }
}

export async function PUT(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const icp = parseIcpInput(await request.json().catch(() => null));
    if ("error" in icp) return apiFailure(icp.error, 400);

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
      where: { clientId: ctx.clientId },
      create: { id: `ICP-${ctx.clientId}`, clientId: ctx.clientId, ...data },
      update: data,
    });
    // The prompts still learn the audience from AUDIENCE directives, so the
    // profile is rewritten as that directive on every save.
    await syncIcpDirective(ctx.clientId, icp);
    return NextResponse.json(toIcpDTO(row));
  } catch (error) {
    return apiError(error, "Failed to save your ideal customer");
  }
}
