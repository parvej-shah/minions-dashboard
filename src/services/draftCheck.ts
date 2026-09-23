import { checkDraft, type DraftCheckResult, type EditorClaim } from "@/lib/drafts/check";
import { getDraftCheckInputs } from "@/services/draftContext";
import { prisma } from "@/lib/prisma";
import { toIcpContext } from "@/services/authorContext";

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** POST /api/internal/drafts/check: loads what the draft may rest on, then runs checkDraft. */
export async function runDraftCheck(body: Record<string, unknown>): Promise<{ error: string } | DraftCheckResult> {
  const clientId = str(body.client_id).trim();
  const ideaId = str(body.idea_id).trim();
  if (!clientId || !ideaId) return { error: "client_id and idea_id are required" };
  if (!str(body.body).trim()) return { error: "body is empty" };

  const [inputs, trust, icpRow] = await Promise.all([
    getDraftCheckInputs(clientId, ideaId),
    prisma.idea.findFirst({ where: { id: ideaId, clientId }, select: { trustBasis: true } }),
    prisma.icpProfile.findUnique({ where: { clientId } }),
  ]);
  const idea = inputs.idea;
  const signals = Array.isArray(idea?.signals) ? (idea.signals as { title?: string; snippet?: string; url?: string }[]) : [];
  const icp = icpRow ? toIcpContext(icpRow) : null;

  return checkDraft({
    hook: str(body.hook),
    body: str(body.body),
    claims: Array.isArray(body.claims) ? (body.claims as EditorClaim[]) : [],
    approvedProofs: inputs.approvedProofs,
    allowCustomerResult: inputs.allowCustomerResult,
    trustBasis: trust?.trustBasis ?? [],
    memory: inputs.memory,
    sources: signals.map((s) => ({ title: s.title, text: s.snippet, url: s.url })),
    knownText: [
      str(body.evidence_block),
      str(body.brand_context),
      inputs.positioning,
      ...inputs.unsourcedProof,
      ...signals.map((s) => `${s.title ?? ""} ${s.snippet ?? ""}`),
      ...(idea ? [idea.rawIdea, idea.angle ?? "", idea.why ?? "", idea.icpProblem ?? "", idea.authorAdvantage ?? ""] : []),
      ...(icp ? Object.values(icp).flat().map(String) : []),
    ],
  });
}
