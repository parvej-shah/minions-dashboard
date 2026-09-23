import { prisma } from "@/lib/prisma";
import { restemKey, thesisKey } from "@/lib/thesis";
import { gateIdeas, gateInputFromContext, type CandidateIdea, type GateContext, type GatedIdea } from "@/lib/harvest/gate";

/** Earlier ideas checked for restatement, beyond the 60 in recent_theses. */
export const DEDUPE_WINDOW = 500;
export const MAX_IDEAS_PER_GATE = 50;

type Body = Record<string, unknown>;

/**
 * POST /api/internal/harvest/gate. Validates the body, adds the tenant's
 * earlier theses for dedupe, and runs the gate. Returns every idea (rejects
 * included, so they can be stored with their reasons) merged over what n8n
 * sent, plus a count per verdict for the run log.
 */
export async function gateHarvestRequest(
  body: Body
): Promise<{ error: string } | { ideas: (CandidateIdea & GatedIdea)[]; summary: Record<string, number> }> {
  const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
  const mode = body.mode === "refine" ? "refine" : body.mode === "harvest" ? "harvest" : null;
  const ideas = Array.isArray(body.ideas) ? (body.ideas.filter((i) => i && typeof i === "object") as CandidateIdea[]) : null;
  const context = body.context && typeof body.context === "object" ? (body.context as GateContext) : null;
  if (!clientId) return { error: "client_id is required" };
  if (!mode) return { error: 'mode must be "harvest" or "refine"' };
  if (!ideas) return { error: "ideas must be an array" };
  if (ideas.length > MAX_IDEAS_PER_GATE) return { error: `At most ${MAX_IDEAS_PER_GATE} ideas per call` };
  if (!context) return { error: "context (the brand context the prompt used) is required" };

  let knownTheses: string[] = [];
  if (mode === "harvest") {
    const rows = await prisma.idea.findMany({
      where: { clientId, OR: [{ gateVerdict: null }, { gateVerdict: { not: "REJECT" } }] },
      orderBy: { createdAt: "desc" },
      take: DEDUPE_WINDOW,
      select: { thesisKey: true, rawIdea: true, angle: true },
    });
    knownTheses = rows.map((r) => (r.thesisKey ? restemKey(r.thesisKey) : thesisKey(r.rawIdea, r.angle))).filter(Boolean);
  }

  const signals = Array.isArray(body.market_signals) ? (body.market_signals as { title?: string; snippet?: string }[]) : [];
  const notes = Array.isArray(body.notes) ? body.notes.map((n) => (typeof n === "string" ? n : "")) : undefined;
  const gated = gateIdeas(gateInputFromContext({ mode, ideas, context, signals, knownTheses, notes }));

  const summary: Record<string, number> = { PASS: 0, BELOW_BAR: 0, REJECT: 0 };
  for (const g of gated) summary[g.gate_verdict]++;
  return { ideas: gated.map((g, i) => ({ ...ideas[i], ...g })), summary };
}
