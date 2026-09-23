/**
 * Idea-quality eval. Runs the REAL harvest path (01's Build Harvest Payload
 * node → src/lib/prompts → DashScope → 01's Parse Harvest JSON node) over the
 * fixed corpus, then has a judge model answer a fixed rubric about every idea.
 * The rubric returns yes/no answers with evidence, and the scores are computed
 * here, so a result can be audited idea by idea.
 *
 *   npm run eval -- --label baseline            # 3 runs per tenant
 *   npm run eval -- --label p3 --runs 5
 *   npm run eval -- --rescore src/test/eval/results/<file>.json
 *
 * --rescore re-applies the code-side checks in rubric.ts to stored verdicts
 * without calling any model, so a change to scoreIdea can be compared on the
 * exact same ideas.
 *
 * Costs real model calls (about 18 per default run), so it never runs in CI.
 * Results land in src/test/eval/results/<date>-<label>.json; commit the ones
 * a PR's claims rest on.
 */
import fs from "node:fs";
import path from "node:path";
import { runCodeNode } from "@/test/n8n/harness";
import { renderPrompt } from "@/lib/prompts";
import { buildBrandContextResponse } from "@/services/brandContext";
import { TENANTS, authorFor, type EvalTenant } from "./corpus";
import { JUDGE_MODEL, renderJudge, scoreIdea, type Verdict, type IdeaScore } from "./rubric";

const ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const RESULTS_DIR = path.join(process.cwd(), "src/test/eval/results");

type Json = Record<string, unknown>;

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function chat(payload: Json): Promise<Json> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) throw new Error("DASHSCOPE_API_KEY is not set (run with --env-file=.env.local)");
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180_000),
    });
    if (res.ok) return (await res.json()) as Json;
    if (attempt >= 3 || res.status < 500) throw new Error(`DashScope ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

function content(response: Json): string {
  const choices = response.choices as { message?: { content?: string } }[] | undefined;
  return (choices?.[0]?.message?.content ?? "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

/** Exactly what GET /api/brand/context would return for this tenant. */
export function contextFor(tenant: EvalTenant, runIndex: number) {
  return buildBrandContextResponse(tenant.settings, tenant.voice, { ...tenant.harvest, runIndex, author: authorFor(tenant) });
}

async function harvestOnce(tenant: EvalTenant, runIndex: number): Promise<Json[]> {
  const ctx = contextFor(tenant, runIndex);
  const [built] = await runCodeNode("01_idea_harvester", "Build Harvest Payload", {
    input: tenant.signals as unknown as Json[],
    nodes: { "Fetch Brand Context": [ctx as unknown as Json] },
  });
  const { payload } = renderPrompt("harvest", built.prompt_inputs as Json) as { payload: Json };
  const response = await chat(payload);
  const ideas = await runCodeNode("01_idea_harvester", "Parse Harvest JSON", {
    input: [response],
    nodes: { "Build Harvest Payload": [built] },
  });
  if (ideas.length === 1 && ideas[0].ok === false) throw new Error(`harvest parse failed: ${ideas[0].error}`);
  return ideas;
}

/** Asks for JSON mode and retries a malformed or short reply twice before giving up. */
async function judge(tenant: EvalTenant, ideas: Json[]): Promise<Verdict[]> {
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await chat({ ...(renderJudge(tenant, ideas) as unknown as Json), response_format: { type: "json_object" } });
    try {
      const parsed = JSON.parse(content(response)) as { verdicts: Verdict[] };
      if (Array.isArray(parsed.verdicts) && parsed.verdicts.length === ideas.length) return parsed.verdicts;
      lastError = `judge returned ${parsed.verdicts?.length ?? 0} verdicts for ${ideas.length} ideas`;
    } catch (e) {
      lastError = `judge returned invalid JSON: ${e instanceof Error ? e.message : e}`;
    }
  }
  throw new Error(lastError);
}

const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

function summarize(scores: IdeaScore[]) {
  const n = scores.length;
  const count = (f: (s: IdeaScore) => boolean) => pct(scores.filter(f).length, n);
  return {
    ideas: n,
    authority_pass: count((s) => s.authority_pass),
    icp_problem: count((s) => s.verdict.icp_problem),
    author_advantage: count((s) => s.author_advantage),
    beyond_source: count((s) => s.verdict.beyond_source),
    generic: count((s) => s.verdict.generic),
    invented_facts: count((s) => s.invented),
    off_positioning: count((s) => s.verdict.off_positioning),
  };
}

function rescore(file: string) {
  const stored = JSON.parse(fs.readFileSync(file, "utf8"));
  const perTenant: Record<string, { summary: ReturnType<typeof summarize>; ideas: IdeaScore[] }> = {};
  for (const [id, t] of Object.entries(stored.tenants as Record<string, { ideas: IdeaScore[] }>)) {
    const tenant = TENANTS.find((x) => x.id === id);
    if (!tenant) throw new Error(`corpus has no tenant ${id}`);
    const ideas = t.ideas.map((s) => scoreIdea({ ...s.idea, signals: s.idea.signal ? [{ title: s.idea.signal }] : [] }, s.verdict, s.run, tenant));
    perTenant[id] = { summary: summarize(ideas), ideas };
  }
  const result = { ...stored, rescored_at: new Date().toISOString(), overall: summarize(Object.values(perTenant).flatMap((t) => t.ideas)), tenants: perTenant };
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  console.table({ overall: result.overall, ...Object.fromEntries(Object.entries(perTenant).map(([k, v]) => [k, v.summary])) });
  console.log(`rescored ${path.relative(process.cwd(), file)}`);
}

async function main() {
  const rescoreFile = arg("rescore", "");
  if (rescoreFile) return rescore(rescoreFile);
  const label = arg("label", "run");
  const runs = Number(arg("runs", "3"));
  const only = arg("tenant", "");
  const tenants = TENANTS.filter((t) => !only || t.id === only);

  const perTenant: Record<string, { summary: ReturnType<typeof summarize>; ideas: IdeaScore[] }> = {};
  for (const tenant of tenants) {
    const scores: IdeaScore[] = [];
    for (let r = 0; r < runs; r++) {
      const ideas = await harvestOnce(tenant, r);
      const verdicts = await judge(tenant, ideas);
      ideas.forEach((idea, i) => scores.push(scoreIdea(idea, verdicts[i], r, tenant)));
      process.stdout.write(`${tenant.id} run ${r + 1}/${runs}: ${ideas.length} ideas\n`);
    }
    perTenant[tenant.id] = { summary: summarize(scores), ideas: scores };
  }

  const all = Object.values(perTenant).flatMap((t) => t.ideas);
  const result = {
    label,
    date: new Date().toISOString(),
    runs,
    judge_model: JUDGE_MODEL,
    overall: summarize(all),
    tenants: perTenant,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${result.date.slice(0, 10)}-${label}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + "\n");

  console.log("\n% of ideas   higher is better: authority_pass icp_problem author_advantage beyond_source");
  console.log("             lower is better:  generic invented_facts off_positioning");
  console.table({ overall: result.overall, ...Object.fromEntries(Object.entries(perTenant).map(([k, v]) => [k, v.summary])) });
  console.log(`\nwrote ${path.relative(process.cwd(), file)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
