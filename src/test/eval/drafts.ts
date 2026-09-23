/**
 * Draft-quality eval (phase 4). Drafts a FIXED set of ideas through the real
 * 02_idea_to_asset path -- its Code nodes, the prompts in src/lib/prompts,
 * DashScope -- then has the judge answer the draft rubric (draftRubric.ts).
 *
 *   npm run eval:drafts -- --make-ideas     # once: harvest the fixed idea set
 *   npm run eval:drafts -- --label baseline
 *
 * The idea set lives in draft-ideas.json and never changes under a
 * comparison. Stops before the variants and cover stages: no image calls.
 */
import fs from "node:fs";
import path from "node:path";
import { runCodeNode, workflowNodes } from "@/test/n8n/harness";
import { renderPrompt } from "@/lib/prompts";
import { TENANTS, authorFor, type EvalTenant } from "./corpus";
import { buildDraftAuthorContext } from "@/lib/drafts/authorContext";
import { checkDraft, type EditorClaim } from "@/lib/drafts/check";
import { writerExpertisePromptGuidance } from "@/constants/writerExpertise";
import { harvestOnce, contextFor } from "./run";
import { arg, chat, content } from "./llm";
import { renderDraftJudge, scoreDraft, type Draft, type DraftScore, type DraftVerdict } from "./draftRubric";
import { JUDGE_MODEL } from "./rubric";

type Json = Record<string, unknown>;
const D = "02_idea_to_asset";
const IDEAS_FILE = path.join(process.cwd(), "src/test/eval/draft-ideas.json");
const RESULTS_DIR = path.join(process.cwd(), "src/test/eval/results");
const PER_TENANT = 3;

/** Harvests the fixed idea set: the first PER_TENANT ideas per tenant the gate keeps. */
async function makeIdeas() {
  const out: Record<string, Json[]> = {};
  for (const tenant of TENANTS) {
    const kept: Json[] = [];
    const history = { sourceTypes: [] as (string | null)[], memoryIds: [] as string[][] };
    for (let run = 0; kept.length < PER_TENANT && run < 4; run++) {
      for (const idea of await harvestOnce(tenant, run, history)) {
        if (idea.gate_verdict === "REJECT" || kept.length >= PER_TENANT) continue;
        kept.push(idea);
        history.sourceTypes.unshift(idea.source_type as string);
        history.memoryIds.unshift(idea.memory_ids as string[]);
      }
    }
    out[tenant.id] = kept;
    console.log(`${tenant.id}: ${kept.length} ideas`);
  }
  fs.writeFileSync(IDEAS_FILE, JSON.stringify({ made: new Date().toISOString(), ideas: out }, null, 2) + "\n");
}

const hasNode = (name: string) => workflowNodes(D).some((n) => n.name === name);

/** What 02's upstream nodes hold for this tenant and idea. */
function upstream(tenant: EvalTenant, idea: Json, index: number) {
  const s = tenant.settings;
  return {
    "Generate run_id": [{ client_id: tenant.id, run_id: "eval" }],
    "Select Target": [{ idea_id: `EVAL-${tenant.id}-${index + 1}`, audience: "ICP", pillar: idea.pillar, raw_idea: idea.raw_idea, angle: idea.angle, why: idea.why, signals: idea.signals ?? [], evidence_required: "Y" }],
    "Fetch Brand Context": [{ brand_name: s.brand_name, positioning: s.positioning, tone_formality: s.tone_guidelines.formality, tone_cadence: s.tone_guidelines.cadence, allowed_proof_claims: s.tone_guidelines.allowed_proof_claims, allow_customer_result_claims: false }],
    "Read Brand": (s.directives ?? []).map((d) => ({ category: d.category, key: d.key, content: d.content, priority: d.priority, audience_scope: d.audience_scope })),
    "Fetch Tone Examples": [] as Json[],
  } as Record<string, Json[]>;
}

async function call(stage: "strategist" | "writer" | "editor", promptInputs: unknown): Promise<Json> {
  const { payload } = renderPrompt(stage, promptInputs) as { payload: Json };
  return chat(payload);
}

/** One draft through strategist -> evidence -> writer -> editor -> claims gate. */
export async function draftOnce(tenant: EvalTenant, idea: Json, index: number): Promise<Draft> {
  const nodes = upstream(tenant, idea, index);
  if (hasNode("Fetch Author Context")) nodes["Fetch Author Context"] = [{ author: draftContextFor(tenant, idea) as unknown as Json }];
  const [assembled] = await runCodeNode(D, "Assemble Brand Context", { nodes });
  nodes["Assemble Brand Context"] = [assembled];

  const [strategy] = await runCodeNode(D, "Parse Strategy JSON", { input: [await call("strategist", assembled.prompt_inputs)], nodes });
  if (!strategy.ok) throw new Error(`strategist: ${strategy.error}`);
  nodes["Parse Strategy JSON"] = [strategy];

  const [evidence] = await runCodeNode(D, "Format Evidence Context", { input: [strategy], nodes });
  nodes["Need Evidence?"] = [strategy];
  nodes["Format Evidence Context"] = [evidence];

  const [writerPayload] = await runCodeNode(D, "Build Writer Payload", { input: [evidence], nodes });
  const [writerOut] = await runCodeNode(D, "Parse Writer Output", { input: [await call("writer", writerPayload.prompt_inputs)], nodes });
  if (writerOut.ok === false) throw new Error(`writer: ${writerOut.error}`);

  const [edited] = await runCodeNode(D, "Parse Editor Output", { input: [await call("editor", writerOut.prompt_inputs)], nodes });
  if (!edited.ok) throw new Error(`editor: ${edited.error}`);
  nodes["Parse Editor Output"] = [edited];

  let check: Json | undefined;
  if (hasNode("Check Draft")) check = checkFor(tenant, idea, edited, String(evidence.evidence_block ?? ""), String(assembled.brand_context ?? "")) as unknown as Json;
  const [gate] = await runCodeNode(D, "Parse Claims and Gate", { nodes, input: check ? [check] : [{}] });
  const s = edited.strategy as Json;
  return { idea, title: String(s.title ?? ""), hook: String(edited.hook ?? ""), body: String(gate.edited_body ?? edited.edited_body ?? ""), claims_ok: String(gate.claims_ok ?? ""), ...(check ? { check } : {}) };
}

/** What POST /api/internal/drafts/context serves for this eval idea (corpus memory is all PUBLIC). */
function draftContextFor(tenant: EvalTenant, idea: Json) {
  const author = authorFor(tenant);
  const byId = new Map(author.memory.map((m) => [m.id, m]));
  const memory = ((idea.memory_ids as string[]) ?? []).flatMap((id) => {
    const m = byId.get(id);
    return m ? [{ kind: m.kind, text: m.content, disclosure: "PUBLIC" as const }] : [];
  });
  const lane = author.lanes.find((l) => l.id === idea.lane_id);
  return buildDraftAuthorContext(
    {
      sourceType: (idea.source_type as string) ?? null,
      trustBasis: (idea.trust_basis as string[]) ?? [],
      icpProblem: (idea.icp_problem as string) ?? null,
      readerContext: (idea.reader_context as string) ?? null,
      authorAdvantage: (idea.author_advantage as string) ?? null,
      whiteSpace: (idea.white_space as string) ?? null,
      freshPerspective: (idea.fresh_perspective as string) ?? null,
      vision: (idea.vision as string) ?? null,
      recommendedFormat: (idea.recommended_format as string) ?? null,
      pillar: (idea.pillar as string) ?? null,
    },
    memory,
    author.icp,
    lane ? { name: lane.name, purpose: lane.purpose, brief: lane.brief } : null,
    writerExpertisePromptGuidance(tenant.harvest.writerExpertise)
  );
}

/** What POST /api/internal/drafts/check returns for this eval draft. */
function checkFor(tenant: EvalTenant, idea: Json, edited: Json, evidenceBlock: string, brandContext: string) {
  const author = authorFor(tenant);
  const ids = new Set((idea.memory_ids as string[]) ?? []);
  return checkDraft({
    hook: String(edited.hook ?? ""),
    body: String(edited.edited_body ?? ""),
    claims: (edited.claims as EditorClaim[]) ?? [],
    approvedProofs: [],
    allowCustomerResult: false,
    trustBasis: (idea.trust_basis as string[]) ?? [],
    memory: author.memory.filter((m) => ids.has(m.id)).map((m) => ({ content: m.content, disclosure: m.disclosure, generalizedContent: null })),
    sources: ((idea.signals as { title?: string; snippet?: string; url?: string }[]) ?? []).map((s) => ({ title: s.title, text: s.snippet, url: s.url })),
    knownText: [
      evidenceBlock,
      brandContext,
      tenant.settings.positioning,
      ...tenant.settings.tone_guidelines.allowed_proof_claims,
      ...["raw_idea", "angle", "why", "icp_problem", "author_advantage"].map((k) => String(idea[k] ?? "")),
      ...Object.values(author.icp).flat().map(String),
    ],
  });
}

async function judge(tenant: EvalTenant, drafts: Draft[]): Promise<DraftVerdict[]> {
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await chat({ ...(renderDraftJudge(tenant, drafts) as unknown as Json), response_format: { type: "json_object" } });
    try {
      const parsed = JSON.parse(content(response)) as { verdicts: DraftVerdict[] };
      if (Array.isArray(parsed.verdicts) && parsed.verdicts.length === drafts.length) return parsed.verdicts;
      last = `judge returned ${parsed.verdicts?.length ?? 0} verdicts for ${drafts.length} drafts`;
    } catch (e) {
      last = `judge returned invalid JSON: ${e instanceof Error ? e.message : e}`;
    }
  }
  throw new Error(last);
}

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const avg = (xs: number[]) => (xs.length ? Math.round((10 * xs.reduce((a, b) => a + b, 0)) / xs.length) / 10 : 0);

export function summarizeDrafts(scores: DraftScore[]) {
  const n = scores.length;
  const count = (f: (s: DraftScore) => boolean) => pct(scores.filter(f).length, n);
  return {
    drafts: n,
    draft_pass: count((s) => s.draft_pass),
    author_advantage: count((s) => s.author_advantage),
    fabrication: count((s) => s.verdict.first_person_fabrication),
    invented: count((s) => s.invented),
    generic: count((s) => s.verdict.generic),
    one_argument: count((s) => s.verdict.one_argument),
    claims_ok_y: count((s) => s.draft.claims_ok === "Y"),
    avg_words: avg(scores.map((s) => s.readability.words)),
    hook_over_210: count((s) => s.readability.hook_chars > 210),
    avg_sentence_words: avg(scores.map((s) => s.readability.avg_sentence_words)),
    long_paragraphs: avg(scores.map((s) => s.readability.long_paragraphs)),
  };
}

/** Re-applies scoreDraft (readability and the code checks) to stored drafts and verdicts, without any model call. */
function rescore(file: string) {
  const stored = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [id, t] of Object.entries(stored.tenants as Record<string, { summary: unknown; drafts: DraftScore[] }>)) {
    const tenant = TENANTS.find((x) => x.id === id)!;
    t.drafts = t.drafts.map((s) => scoreDraft(s.draft, s.verdict, tenant));
    t.summary = summarizeDrafts(t.drafts);
  }
  stored.overall = summarizeDrafts(Object.values(stored.tenants as Record<string, { drafts: DraftScore[] }>).flatMap((t) => t.drafts));
  stored.rescored_at = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(stored, null, 2) + "\n");
  console.log(JSON.stringify(stored.overall));
}

async function main() {
  if (process.argv.includes("--make-ideas")) return makeIdeas();
  const rescoreFile = arg("rescore", "");
  if (rescoreFile) return rescore(rescoreFile);
  const label = arg("label", "run");
  const { ideas } = JSON.parse(fs.readFileSync(IDEAS_FILE, "utf8")) as { ideas: Record<string, Json[]> };
  const perTenant: Record<string, { summary: ReturnType<typeof summarizeDrafts>; drafts: DraftScore[] }> = {};
  for (const tenant of TENANTS) {
    const drafts: Draft[] = [];
    for (const [i, idea] of (ideas[tenant.id] ?? []).entries()) {
      drafts.push(await draftOnce(tenant, idea, i));
      process.stdout.write(`${tenant.id} draft ${i + 1}/${ideas[tenant.id].length}\n`);
    }
    const verdicts = await judge(tenant, drafts);
    const scores = drafts.map((d, i) => scoreDraft(d, verdicts[i], tenant));
    perTenant[tenant.id] = { summary: summarizeDrafts(scores), drafts: scores };
  }
  const all = Object.values(perTenant).flatMap((t) => t.drafts);
  const result = { label, date: new Date().toISOString(), judge_model: JUDGE_MODEL, overall: summarizeDrafts(all), tenants: perTenant };
  const file = path.join(RESULTS_DIR, `drafts-${result.date.slice(0, 10)}-${label}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  console.table({ overall: result.overall, ...Object.fromEntries(Object.entries(perTenant).map(([k, v]) => [k, v.summary])) });
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}

void contextFor;
if (process.argv[1]?.endsWith("drafts.ts")) main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exitCode = 1;
});
