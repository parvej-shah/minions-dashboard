import { PROFILE_TARGETS, type ProfileTarget } from "@/constants/contentLanes";
import { MEMORY_KIND_SOURCE, type SourceType } from "@/constants/sourceMix";
import type { IcpContext, LaneContext, MemoryContext } from "@/services/authorContext";
import { restemKey, thesisKey, tokenOverlap } from "@/lib/thesis";
import { contentWords, numbersIn, sharedWords, unsupportedNumbers } from "./text";
import { memoryRef, proofRef, type HarvestSlot } from "./plan";

/**
 * The authority gate (phase 3 of docs/product/authority-flywheel-plan.md).
 * The model supplies labelled evidence; every decision here is code:
 *
 *   REJECT     not stored as a candidate: no ICP problem, a restated recent
 *              idea, a cited experience that does not exist or is not really
 *              used, a figure no input supports, or a Generalize item's
 *              specifics. Kept as an archived row with its reasons, so the
 *              Ideas page can show why it was dropped.
 *   BELOW_BAR  sound, but rests on no experience or proof. Kept and labelled,
 *              never presented as a strong idea (D1, D17).
 *   PASS       a specific ICP problem and a real author advantage.
 *
 * Refine (a person's own note) is never rejected: the note is its own trust
 * basis, so problems there only lower it to BELOW_BAR.
 */

export const GATE_VERDICTS = ["PASS", "BELOW_BAR", "REJECT"] as const;
export type GateVerdict = (typeof GATE_VERDICTS)[number];

export const TRUST_BASES = ["LIVED_EXPERIENCE", "APPROVED_PROOF", "MARKET_SIGNAL", "USER_NOTE"] as const;
export type TrustBasis = (typeof TRUST_BASES)[number];

export const RECOMMENDED_FORMATS = ["POST", "ARTICLE"] as const;
export type RecommendedFormat = (typeof RECOMMENDED_FORMATS)[number];

/** Content words the idea must share with an item it cites, to count as using it. */
export const MIN_USE_WORDS = 3;
/** The evidence quote: at least this many content words, and this share of them found in the item. */
export const MIN_QUOTE_WORDS = 3;
export const QUOTE_COVERAGE = 0.8;
/** Same threshold as src/lib/thesis.ts isRedundantThesis. */
export const DUPLICATE_OVERLAP = 0.5;

/** Score weights (plan section 2, point 3) with predicted impressions at 0 until there is data. */
export const SCORE_WEIGHTS = { authority: 40, icp: 15, originality: 10, evidence: 10 } as const;
export const HIGH_PRIORITY_SCORE = 70;

/** One idea as the harvest or refine model returned it (after Parse … JSON). */
export interface CandidateIdea {
  slot?: unknown;
  raw_idea?: unknown;
  angle?: unknown;
  why?: unknown;
  pillar?: unknown;
  lane?: unknown;
  profile_target?: unknown;
  recommended_format?: unknown;
  memory_refs?: unknown;
  evidence_quote?: unknown;
  icp_problem?: unknown;
  reader_context?: unknown;
  author_advantage?: unknown;
  white_space?: unknown;
  fresh_perspective?: unknown;
  vision?: unknown;
  /** Set by Attach Source URLs when the idea used a market signal. */
  signals?: unknown;
  [key: string]: unknown;
}

export interface GateInput {
  mode: "harvest" | "refine";
  ideas: CandidateIdea[];
  /** Harvest only: the plan the prompt was rendered from. */
  plan?: HarvestSlot[];
  /** In prompt order: memory[i] is M{i+1}. */
  memory: MemoryContext[];
  /** Approved proof claims in prompt order: proof[i] is P{i+1}. */
  proof: string[];
  icp: IcpContext;
  lanes: LaneContext[];
  /** Every other text the model saw (signals, positioning, directives, notes): what a figure may come from. */
  knownText: string[];
  /** Thesis keys already in the pipeline. Harvest only. */
  knownTheses: string[];
  /** Refine only: the person's note behind each idea, by index. */
  notes?: string[];
}

export interface ScoreBreakdown {
  authority: number;
  icp: number;
  originality: number;
  evidence: number;
  score: number;
  /** Did the idea build on the seed its slot was given? Harvest only. */
  seed_used?: boolean;
}

export interface GatedIdea {
  raw_idea: string;
  angle: string;
  why: string;
  pillar: string;
  source_type: SourceType | null;
  lane_id: string | null;
  profile_target: ProfileTarget;
  recommended_format: RecommendedFormat;
  memory_ids: string[];
  trust_basis: TrustBasis[];
  icp_problem: string;
  reader_context: string;
  author_advantage: string;
  white_space: string;
  fresh_perspective: string;
  vision: string | null;
  thesis_key: string | null;
  gate_verdict: GateVerdict;
  gate_reasons: string[];
  score_breakdown: ScoreBreakdown;
  priority: "HIGH" | "MEDIUM" | "LOW";
  /** 0-100, the ICP part of the score; kept for the existing column. */
  icp_relevance: number;
}

/** The prompt's own labels for signals, memory and proof. */
const INTERNAL_REF = /\b(?:signal\s*#?\s*\d+|\[\d+\]|[MP]\d{1,3})\b/gi;

/** "(Signal 14)", "(M5, M10)": a bare citation in brackets carries no meaning and can go. */
const CITATION_PARENS = /\s*\((?:signal\s*#?\s*\d+|[MP]\d{1,3})(?:\s*(?:,|;|and|&)\s*(?:signal\s*#?\s*\d+|[MP]\d{1,3}))*\)/gi;

/** Removes bracketed citations; labels in running text are left for the gate to reject. */
export function stripCitations(s: string): string {
  return s.replace(CITATION_PARENS, "").replace(/\s+([.,;:])/g, "$1");
}

const text = (v: unknown) => (typeof v === "string" ? v.replace(/—/g, ", ").trim() : "");

/** Capitalised words that are not at the start of a sentence: names, places, brands. */
function properNouns(s: string): string[] {
  const out = new Set<string>();
  for (const m of s.matchAll(/(?<![.!?:]\s|^)\b([A-Z][a-zA-Z0-9&'-]{2,})/g)) out.add(m[1]);
  return [...out];
}

function quoteMatches(quote: string, item: string): boolean {
  const q = [...contentWords(quote)];
  if (q.length < MIN_QUOTE_WORDS) return false;
  const itemWords = contentWords(item);
  return q.filter((w) => itemWords.has(w)).length / q.length >= QUOTE_COVERAGE;
}

function laneFor(name: string, lanes: LaneContext[]): LaneContext | null {
  const wanted = name.trim().toLowerCase();
  return (wanted && lanes.find((l) => l.name.trim().toLowerCase() === wanted)) || null;
}

function icpScore(problem: string, icp: IcpContext): number {
  if (!problem) return 0;
  const terms = [...icp.pains, ...icp.decisions, ...icp.questions, ...icp.buying_triggers];
  if (!terms.length) return 0.5;
  return terms.some((t) => sharedWords(problem, t) >= 2) ? 1 : 0.5;
}

export function gateIdeas(input: GateInput): GatedIdea[] {
  const refine = input.mode === "refine";
  const refs = new Map<string, { content: string; memory?: MemoryContext }>();
  input.memory.forEach((m, i) => refs.set(memoryRef(i), { content: m.content, memory: m }));
  input.proof.forEach((p, i) => refs.set(proofRef(i), { content: p }));

  const known = input.knownTheses.filter(Boolean).map((k) => restemKey(k).split("-"));
  const figureSources = [
    ...input.memory.map((m) => m.content),
    ...input.proof,
    ...input.knownText,
    ...Object.values(input.icp).flat().map(String),
  ];

  return input.ideas.map((idea, index) => {
    const raw_idea = stripCitations(text(idea.raw_idea));
    const angle = stripCitations(text(idea.angle));
    const why = stripCitations(text(idea.why));
    const icp_problem = text(idea.icp_problem);
    const author_advantage = text(idea.author_advantage);
    const quote = text(idea.evidence_quote);
    const note = refine ? text(input.notes?.[index]) : "";
    // The claim itself must carry the experience; author_advantage is only
    // the model's note about it, and the writer never publishes that field.
    const ideaText = [raw_idea, angle, why].join(" ");
    const reject: string[] = [];
    const below: string[] = [];
    // What would reject a harvested idea only lowers a person's own note.
    const fail = refine ? below : reject;

    // Planned slot: by the model's own slot number, else by position.
    const slotNo = Number(idea.slot);
    const slot = input.plan?.find((s) => s.slot === slotNo) ?? input.plan?.[index];

    if (!raw_idea) fail.push("The idea is empty.");
    if (!icp_problem) fail.push("Names no specific problem the ICP faces.");

    // Cited experience and proof must exist, be quoted, and be used.
    const cited = Array.from(new Set((Array.isArray(idea.memory_refs) ? idea.memory_refs : []).map((r) => String(r).trim().toUpperCase())));
    const missing = cited.filter((r) => !refs.has(r));
    if (missing.length) fail.push(`Cites ${missing.join(", ")}, which the author never saved.`);
    const present = cited.filter((r) => refs.has(r));
    const used = present.filter((r) => sharedWords(ideaText, refs.get(r)!.content) >= MIN_USE_WORDS);
    const quoted = present.some((r) => quoteMatches(quote, refs.get(r)!.content));
    let grounded: string[] = [];
    if (present.length && !quoted) fail.push("Its evidence quote is not from the experience it cites.");
    else if (present.length && !used.length) fail.push("Cites experience the idea does not actually use.");
    else grounded = used;

    // Generalize: the lesson may be used, never the names, places or figures.
    for (const r of grounded) {
      const m = refs.get(r)!.memory;
      if (m?.disclosure !== "GENERALIZE") continue;
      const leaked = [
        ...numbersIn(m.content).filter((n) => numbersIn(ideaText + " " + author_advantage).includes(n) && Number(n) >= 10),
        ...properNouns(m.content).filter((w) => new RegExp(`\\b${w}\\b`).test(ideaText + " " + author_advantage)),
      ];
      if (leaked.length) fail.push(`Uses specifics from a Generalize item (${r}): ${leaked.join(", ")}.`);
    }

    // Internal labels ("Signal 14", "M3", "P1") would leak into the draft.
    const claimText = [raw_idea, angle, why].join(" ");
    const labels = Array.from(new Set(claimText.match(INTERNAL_REF) ?? []));
    if (labels.length) fail.push(`Mentions internal references instead of saying what they are: ${labels.join(", ")}.`);

    const invented = unsupportedNumbers([raw_idea, angle, why, author_advantage, icp_problem].join(" ").replace(INTERNAL_REF, " "), [...figureSources, note]);
    if (invented.length) fail.push(`States figures found in no input: ${invented.join(", ")}.`);

    // Restating a recent idea (harvest only: a person's note is their call).
    const key = thesisKey(raw_idea, angle) || null;
    let maxOverlap = 0;
    if (key) {
      const tokens = key.split("-");
      for (const prior of known) maxOverlap = Math.max(maxOverlap, prior.join("-") === key ? 1 : tokenOverlap(tokens, prior));
      if (!refine && maxOverlap >= DUPLICATE_OVERLAP) reject.push("Restates an idea already in the pipeline.");
      if (!refine) known.push(tokens);
    }

    const memoryIds = grounded.map((r) => refs.get(r)!.memory?.id).filter((id): id is string => Boolean(id));
    const provenBy = grounded.filter((r) => !refs.get(r)!.memory);
    const signalUsed = Array.isArray(idea.signals) && idea.signals.length > 0;
    const trust: TrustBasis[] = [];
    if (memoryIds.length) trust.push("LIVED_EXPERIENCE");
    if (provenBy.length) trust.push("APPROVED_PROOF");
    if (signalUsed) trust.push("MARKET_SIGNAL");
    if (refine) trust.push("USER_NOTE");

    const hasAdvantage = memoryIds.length > 0 || provenBy.length > 0 || refine;
    if (!hasAdvantage && !reject.length) below.push("Rests on none of the author's experience or proof.");

    const seedUsed = slot?.seed.kind === "MEMORY" ? memoryIds.includes(slot.seed.memory_id) : undefined;
    let source_type: SourceType | null;
    if (refine) source_type = "USER_NOTE";
    else if (seedUsed === false && memoryIds.length) {
      // Built on other experience than planned: record what it really rests on, so the mix stays honest.
      const first = input.memory.find((m) => m.id === memoryIds[0])!;
      source_type = MEMORY_KIND_SOURCE[first.kind]?.sourceType ?? slot?.source_type ?? null;
    } else source_type = slot?.source_type ?? (signalUsed ? "MARKET_SIGNAL" : null);

    const authority = memoryIds.length || refine ? 1 : provenBy.length ? 0.7 : 0;
    const icp = icpScore(icp_problem, input.icp);
    const originality = refine ? 1 : Math.round((1 - maxOverlap) * 100) / 100;
    const evidence = trust.length >= 2 ? 1 : trust.length === 1 ? 0.6 : 0;
    const w = SCORE_WEIGHTS;
    const score = Math.round((100 * (w.authority * authority + w.icp * icp + w.originality * originality + w.evidence * evidence)) / (w.authority + w.icp + w.originality + w.evidence));

    const gate_verdict: GateVerdict = reject.length ? "REJECT" : below.length ? "BELOW_BAR" : "PASS";
    const lane = laneFor(text(idea.lane), input.lanes);
    const target = text(idea.profile_target).toUpperCase();
    const format = text(idea.recommended_format).toUpperCase();
    const vision = text(idea.vision);

    return {
      raw_idea,
      angle,
      why,
      pillar: slot?.pillar ?? text(idea.pillar),
      source_type,
      lane_id: lane?.id ?? null,
      profile_target: (PROFILE_TARGETS as readonly string[]).includes(target) ? (target as ProfileTarget) : lane?.profile_target ?? "PERSONAL",
      recommended_format: (RECOMMENDED_FORMATS as readonly string[]).includes(format) ? (format as RecommendedFormat) : "POST",
      memory_ids: memoryIds,
      trust_basis: trust,
      icp_problem,
      reader_context: text(idea.reader_context),
      author_advantage: hasAdvantage ? author_advantage : "",
      white_space: text(idea.white_space),
      fresh_perspective: text(idea.fresh_perspective),
      vision: vision && vision.toLowerCase() !== "null" ? vision : null,
      thesis_key: key,
      gate_verdict,
      gate_reasons: reject.length ? reject : below,
      score_breakdown: { authority, icp, originality, evidence, score, ...(seedUsed === undefined ? {} : { seed_used: seedUsed }) },
      priority: gate_verdict === "PASS" ? (score >= HIGH_PRIORITY_SCORE ? "HIGH" : "MEDIUM") : "LOW",
      icp_relevance: Math.round(icp * 100),
    };
  });
}

/** The parts of GET /api/brand/context the gate reads. */
export interface GateContext {
  positioning?: string;
  voice_guidelines?: { allowed_proof?: string[] };
  directives?: { content?: string; instruction?: string }[];
  icp?: IcpContext;
  professional_memory?: MemoryContext[];
  content_lanes?: LaneContext[];
  harvest_plan?: HarvestSlot[];
  recent_theses?: string[];
}

const EMPTY_GATE_ICP: IcpContext = { who: "", role: "", company_type: "", pains: [], decisions: [], questions: [], buying_triggers: [], vocabulary: [] };

/**
 * Builds the gate's input from the same brand context the prompt was rendered
 * from, so M1.., P1.. and the slots mean the same thing in both.
 */
export function gateInputFromContext(args: {
  mode: GateInput["mode"];
  ideas: CandidateIdea[];
  context: GateContext;
  signals?: { title?: string; snippet?: string }[];
  knownTheses?: string[];
  notes?: string[];
}): GateInput {
  const c = args.context;
  return {
    mode: args.mode,
    ideas: args.ideas,
    plan: args.mode === "harvest" ? c.harvest_plan ?? [] : undefined,
    memory: c.professional_memory ?? [],
    proof: (c.voice_guidelines?.allowed_proof ?? []).filter((p) => p && p.trim()),
    icp: c.icp ?? EMPTY_GATE_ICP,
    lanes: c.content_lanes ?? [],
    knownText: [
      c.positioning ?? "",
      ...(c.directives ?? []).map((d) => d.content || d.instruction || ""),
      ...(args.signals ?? []).map((s) => `${s.title ?? ""} ${s.snippet ?? ""}`),
    ],
    knownTheses: [...(c.recent_theses ?? []), ...(args.knownTheses ?? [])],
    notes: args.notes,
  };
}
