/**
 * Weekly-answer extraction eval (phase 6). Runs the real extraction prompt
 * (src/lib/prompts/pulse.ts) on FIXED sample answers and scores in code:
 *
 * - raw faithful: model items that add no figure, name or link the answer lacks
 * - kept: items that pass the code check (src/lib/pulse/extract.ts)
 * - count in range: kept items within the answer's expected range
 * - kinds: kept items whose kind is one the answer plausibly fits
 *
 *   npm run eval:pulse -- --label baseline
 */
import fs from "node:fs";
import path from "node:path";
import { arg } from "./llm";
import { checkCandidates, parseItems, unsupported, sourceText, type PulseFollowups } from "@/lib/pulse/extract";
import { renderPulseExtract } from "@/lib/prompts/pulse";
import { chatWithFallback } from "@/lib/ai/modelChain";

interface Case {
  id: string;
  answer: string;
  followups?: PulseFollowups;
  icp: string;
  /** Inclusive range of items a good extraction gives. */
  expect: [number, number];
  kinds: string[];
}

const CASES: Case[] = [
  {
    id: "one-lesson",
    icp: "Owners of real estate brokerages",
    answer: "Shipped the call-summary validator for our real estate pilot. I'd assumed agents wanted transcripts; they only open the 3-line summary. Changed my mind about building a transcript viewer.",
    expect: [1, 2],
    kinds: ["CURRENT_WORK", "LESSON", "OPINION", "BUILD_IN_PUBLIC"],
  },
  {
    id: "three-points",
    icp: "Owners of home service businesses",
    answer: "Three things this week. We moved the booking agent off the single-prompt setup and split it into talk and validate; failed bookings dropped from about 1 in 10 to 1 in 40. A plumber asked me whether the AI can refuse emergency jobs outside the service area, which I hadn't thought about. And I now think voice demos are a bad sales tool: they show the easy path.",
    expect: [3, 3],
    kinds: ["CURRENT_WORK", "LESSON", "EXPERIMENT", "ICP_QUESTION", "OPINION", "BUILD_IN_PUBLIC"],
  },
  {
    id: "client-not-named",
    icp: "Dental practice managers",
    answer: "Brightsmile Dental in Austin told us the AI receptionist booked 14 new patients in its first week, but two were double-booked because their calendar sync lags by minutes.",
    followups: { named: "NO" },
    expect: [1, 2],
    kinds: ["STORY", "LESSON", "CURRENT_WORK", "EXPERIMENT"],
  },
  {
    id: "vague",
    icp: "B2B SaaS founders",
    answer: "Busy week, mostly meetings and some bug fixing. Nothing big shipped.",
    expect: [0, 1],
    kinds: ["CURRENT_WORK"],
  },
  {
    id: "changed-mind",
    icp: "Heads of operations at logistics firms",
    answer: "I used to tell people to automate the whole dispatch flow at once. After watching a customer roll back after two days, I now think you automate the confirmation call first and leave assignment to people until the data is clean.",
    expect: [1, 2],
    kinds: ["OPINION", "LESSON", "STORY"],
  },
  {
    id: "experiment-with-evidence",
    icp: "Marketing leads at agencies",
    answer: "Testing whether posting the cover as a quote instead of a headline changes reach.",
    followups: { problem: "Our headline covers look alike and get skipped.", evidence: "Two quote covers so far, both above my median impressions; too early to say." },
    expect: [1, 1],
    kinds: ["EXPERIMENT", "BUILD_IN_PUBLIC", "CURRENT_WORK"],
  },
  {
    id: "customer-questions",
    icp: "Property managers",
    answer: "Two landlords asked the same thing this week: if a tenant calls at 2am about a leak, does the AI wake someone up or just log it? We route it to the on-call phone, but nobody knows that until they ask.",
    expect: [1, 2],
    kinds: ["ICP_QUESTION", "CURRENT_WORK", "LESSON"],
  },
  {
    id: "build-in-public",
    icp: "Solo consultants",
    answer: "Launched the weekly question in Minions today. It asks what you built or learned, turns the answer into notes, and you confirm them before anything is saved.",
    expect: [1, 1],
    kinds: ["BUILD_IN_PUBLIC", "CURRENT_WORK"],
  },
];

async function rawItems(c: Case): Promise<unknown[] | null> {
  const res = await chatWithFallback(
    renderPulseExtract({ answer: c.answer, followups: c.followups ?? {}, icp: c.icp }) as unknown as Record<string, unknown>,
    process.env.DASHSCOPE_API_KEY!
  );
  return parseItems(res.status < 300 ? JSON.parse(res.body)?.choices?.[0]?.message?.content ?? null : null);
}

(async () => {
  const label = arg("label", "run");
  const rows = [];
  let raw = 0, rawFaithful = 0, kept = 0, inRange = 0, kindOk = 0, generalizeOk = 0, generalizeCases = 0;

  for (const c of CASES) {
    // One model call, scored raw and after the code check the product applies.
    const parsed = await rawItems(c);
    const items = parsed ?? [];
    const result = checkCandidates(parsed, c.answer, c.followups ?? {});
    const source = sourceText(c.answer, c.followups ?? {});
    const rawChecked = items.map((i) => {
      const content = String((i as Record<string, unknown>)?.content ?? "");
      return { kind: (i as Record<string, unknown>)?.kind, content, invented: unsupported(content, source) };
    });
    raw += rawChecked.length;
    rawFaithful += rawChecked.filter((r) => !r.invented.length).length;
    const n = result.fallback ? 0 : result.candidates.length;
    kept += n;
    if (n >= c.expect[0] && n <= c.expect[1]) inRange++;
    kindOk += result.fallback ? 0 : result.candidates.filter((k) => c.kinds.includes(k.kind)).length;
    if (c.followups?.named === "NO") {
      generalizeCases++;
      if (result.candidates.every((k) => k.disclosure === "GENERALIZE")) generalizeOk++;
    }
    rows.push({ id: c.id, raw: rawChecked, kept: result.candidates, dropped: result.dropped, fallback: result.fallback });
    console.log(`\n## ${c.id}  (expect ${c.expect.join("-")}, kept ${n}${result.fallback ? ", FALLBACK" : ""})`);
    for (const r of rawChecked) console.log(`  raw  [${r.kind}] ${r.content}${r.invented.length ? `   << invented: ${r.invented.join(", ")}` : ""}`);
  }

  const summary = {
    label,
    cases: CASES.length,
    raw_items: raw,
    raw_faithful_pct: raw ? Math.round((rawFaithful / raw) * 100) : 0,
    kept_items: kept,
    count_in_range_pct: Math.round((inRange / CASES.length) * 100),
    kind_fit_pct: kept ? Math.round((kindOk / kept) * 100) : 0,
    generalize_honoured: `${generalizeOk}/${generalizeCases}`,
  };
  console.log("\n", summary);
  const out = path.join(process.cwd(), "src/test/eval/results", `pulse-${new Date().toISOString().slice(0, 10)}-${label}.json`);
  fs.writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
  console.log("wrote", path.relative(process.cwd(), out));
})();
