import { describe, expect, it } from "vitest";
import { DEFAULT_LANES } from "@/constants/contentLanes";
import { isRedundantThesis, thesisKey } from "@/lib/thesis";
import type { IcpContext, LaneContext, MemoryContext } from "@/services/authorContext";
import { gateIdeas, type CandidateIdea, type GateInput } from "./gate";
import type { HarvestSlot } from "./plan";

const MEMORY: MemoryContext[] = [
  { id: "mem-story", kind: "STORY", content: "A practice owner thought a new hygienist was unaffordable; the cash report showed insurance reimbursements arriving 47 days late.", disclosure: "PUBLIC", used_count: 0 },
  { id: "mem-lesson", kind: "LESSON", content: "Practices at Brightsmile Dental that financed more than two major items in a year were cash-negative for the next two quarters.", disclosure: "GENERALIZE", used_count: 0 },
  { id: "mem-work", kind: "CURRENT_WORK", content: "Building a one-page monthly cash report that shows collections, overhead and a safe-to-spend number.", disclosure: "PUBLIC", used_count: 0 },
];
const ICP: IcpContext = {
  who: "Dental practice owners",
  role: "Owner",
  company_type: "",
  pains: ["Profit on paper but no cash in the bank"],
  decisions: ["Whether to hire another hygienist"],
  questions: ["Can I afford a second location?"],
  buying_triggers: [],
  vocabulary: [],
};
const LANES: LaneContext[] = DEFAULT_LANES.map((l) => ({ id: `lane-${l.slug}`, name: l.name, purpose: l.purpose, brief: l.brief, weight: l.weight, profile_target: l.slug === "decisions" ? "COMPANY" : "PERSONAL" }));
const PLAN: HarvestSlot[] = [
  { slot: 1, bucket: "EXPERIENCE", source_type: "PAST_EXPERIENCE", pillar: "What Went Wrong", pillar_brief: "", seed: { kind: "MEMORY", ref: "M1", memory_id: "mem-story" } },
  { slot: 2, bucket: "MARKET", source_type: "MARKET_SIGNAL", pillar: "What Changed", pillar_brief: "", seed: { kind: "MARKET" } },
];

const good: CandidateIdea = {
  slot: 1,
  raw_idea: "The hygienist looked unaffordable, but insurance reimbursements arriving 47 days late were the real cash problem.",
  angle: "Before cutting a hire, check when insurance reimbursements actually arrive.",
  icp_problem: "Whether to hire another hygienist when cash feels tight",
  author_advantage: "Saw a cash report where insurance reimbursements arrived 47 days late.",
  memory_refs: ["M1"],
  evidence_quote: "insurance reimbursements arriving 47 days late",
  lane: "decision guides",
  why: "Owners decide on hiring from the bank balance.",
};

function input(ideas: CandidateIdea[], over: Partial<GateInput> = {}): GateInput {
  return { mode: "harvest", ideas, plan: PLAN, memory: MEMORY, proof: ["Twelve years doing books for dental practices"], icp: ICP, lanes: LANES, knownText: [], knownTheses: [], ...over };
}
const one = (idea: CandidateIdea, over: Partial<GateInput> = {}) => gateIdeas(input([idea], over))[0];

describe("the authority gate", () => {
  it("passes an idea with a real ICP problem that uses the experience it quotes", () => {
    const g = one(good);
    expect(g.gate_verdict).toBe("PASS");
    expect(g.gate_reasons).toEqual([]);
    expect(g.memory_ids).toEqual(["mem-story"]);
    expect(g.trust_basis).toEqual(["LIVED_EXPERIENCE"]);
    expect(g.source_type).toBe("PAST_EXPERIENCE");
    expect(g.score_breakdown).toMatchObject({ authority: 1, icp: 1, seed_used: true });
    expect(g.priority).toBe("HIGH");
    expect(g.pillar).toBe("What Went Wrong");
  });

  it("labels an idea resting on no experience BELOW_BAR, never PASS", () => {
    const g = one({ ...good, memory_refs: [], evidence_quote: "", author_advantage: "", raw_idea: "Hygienists pay for themselves.", angle: "Hire earlier." });
    expect(g.gate_verdict).toBe("BELOW_BAR");
    expect(g.gate_reasons[0]).toMatch(/none of the author's experience/);
    expect(g.author_advantage).toBe("");
    expect(g.priority).toBe("LOW");
  });

  it("rejects an idea with no ICP problem", () => {
    expect(one({ ...good, icp_problem: "" }).gate_verdict).toBe("REJECT");
  });

  it("rejects a cited experience the author never saved", () => {
    const g = one({ ...good, memory_refs: ["M1", "M9"] });
    expect(g.gate_verdict).toBe("REJECT");
    expect(g.gate_reasons.join(" ")).toMatch(/M9/);
  });

  it("rejects an evidence quote that is not from the cited item", () => {
    const g = one({ ...good, evidence_quote: "owners always underestimate payroll taxes" });
    expect(g.gate_verdict).toBe("REJECT");
    expect(g.gate_reasons.join(" ")).toMatch(/quote/);
  });

  it("counts only the idea's own text as using the experience, not the model's note about it", () => {
    const g = one({ ...good, raw_idea: "Hiring decisions should follow cash timing.", angle: "Check timing first.", why: "", author_advantage: good.author_advantage });
    expect(g.gate_verdict).toBe("REJECT");
  });

  it("rejects an idea that cites experience it does not use", () => {
    const g = one({ ...good, raw_idea: "Marketing budgets should follow the season.", angle: "Spend in spring.", author_advantage: "Knows budgets." });
    expect(g.gate_verdict).toBe("REJECT");
    expect(g.gate_reasons.join(" ")).toMatch(/does not actually use/);
  });

  it("rejects a figure no input supports, and allows one from memory", () => {
    const invented = one({ ...good, angle: "Reimbursements arriving 47 days late cost owners 18% of collections." });
    expect(invented.gate_verdict).toBe("REJECT");
    expect(invented.gate_reasons.join(" ")).toMatch(/18/);
    expect(one(good).gate_reasons).toEqual([]);
  });

  it("rejects an idea that names the prompt's internal labels, without calling them invented figures", () => {
    const g = one({ ...good, why: "Signal 14 shows insurers paying later, and M1 proves the cost." });
    expect(g.gate_verdict).toBe("REJECT");
    expect(g.gate_reasons.join(" ")).toMatch(/internal references.*Signal 14.*M1/);
    expect(g.gate_reasons.join(" ")).not.toMatch(/figures/);
  });

  it("drops bracketed citations and keeps the idea", () => {
    const g = one({ ...good, why: "Owners decide on hiring from the bank balance (Signal 14), as insurers slow down (M1, P1)." });
    expect(g.gate_verdict).toBe("PASS");
    expect(g.why).toBe("Owners decide on hiring from the bank balance, as insurers slow down.");
  });

  it("allows a figure from a market signal it was shown", () => {
    const g = one({ ...good, angle: "Reimbursements arriving 47 days late matter more now that claims take 30 days." }, { knownText: ["Insurers now take 30 days to settle claims"] });
    expect(g.gate_verdict).toBe("PASS");
  });

  it("rejects an idea that uses a Generalize item's names or figures, and passes its lesson", () => {
    const base = { ...good, slot: 2, memory_refs: ["M2"], evidence_quote: "financed more than two major items in a year were cash-negative" };
    const leaked = one({ ...base, raw_idea: "At Brightsmile Dental, financing more than two major items in a year left practices cash-negative.", angle: "Stop financing major items in a year.", author_advantage: "Saw practices cash-negative after financing major items." });
    expect(leaked.gate_verdict).toBe("REJECT");
    expect(leaked.gate_reasons.join(" ")).toMatch(/Generalize.*Brightsmile/);
    const lesson = one({ ...base, raw_idea: "Financing more than two major items in a year tends to leave a practice cash-negative for months.", angle: "Cheap monthly payments hide the cash hit of stacked major items.", author_advantage: "Saw practices go cash-negative after financing several major items in one year." });
    expect(lesson.gate_verdict).toBe("PASS");
  });

  it("rejects a restatement of a recent idea, and a repeat within the same run", () => {
    const known = [thesisKey(good.raw_idea as string, good.angle as string)];
    expect(one(good, { knownTheses: known }).gate_reasons).toContain("Restates an idea already in the pipeline.");
    const [first, second] = gateIdeas(input([good, { ...good, slot: 2 }]));
    expect(first.gate_verdict).toBe("PASS");
    expect(second.gate_verdict).toBe("REJECT");
  });

  it("agrees with isRedundantThesis on what counts as the same argument", () => {
    const recent = [{ raw_idea: "Water heaters fail in winter because sediment builds up", angle: "Flush the tank every year" }];
    const known = recent.map((r) => thesisKey(r.raw_idea, r.angle));
    for (const c of [
      { raw_idea: "Sediment buildup is why water heaters fail each winter", angle: "Flush tanks yearly" },
      { raw_idea: "Low-flow toilets clog more when drain slope is wrong", angle: "Check slope before replacing" },
    ]) {
      const redundant = isRedundantThesis({ rawIdea: c.raw_idea, angle: c.angle }, known.map((k) => ({ thesisKey: k })));
      const g = one({ ...good, ...c }, { knownTheses: known });
      expect(g.gate_reasons.includes("Restates an idea already in the pipeline."), c.raw_idea).toBe(redundant);
      expect(g.thesis_key).toBe(thesisKey(c.raw_idea, c.angle));
    }
  });

  it("counts approved proof as author advantage, below lived experience", () => {
    const g = one({ ...good, memory_refs: ["P1"], evidence_quote: "Twelve years doing books for dental practices", raw_idea: "Twelve years doing the books for dental practices shows the hire question is really a cash-timing question." });
    expect(g.gate_verdict).toBe("PASS");
    expect(g.trust_basis).toEqual(["APPROVED_PROOF"]);
    expect(g.memory_ids).toEqual([]);
    expect(g.score_breakdown.authority).toBe(0.7);
  });

  it("records what an idea really rests on when it ignores its seed", () => {
    const g = one({ ...good, memory_refs: ["M3"], evidence_quote: "one-page monthly cash report that shows collections", raw_idea: "A one-page monthly cash report that shows collections and overhead answers the hiring question.", angle: "Read the one-page cash report before you hire." });
    expect(g.gate_verdict).toBe("PASS");
    expect(g.source_type).toBe("CURRENT_WORK");
    expect(g.score_breakdown.seed_used).toBe(false);
  });

  it("maps the lane by name and takes the profile target from it", () => {
    const g = one(good);
    expect(g.lane_id).toBe("lane-decisions");
    expect(g.profile_target).toBe("COMPANY");
    expect(g.recommended_format).toBe("POST");
    const unknown = one({ ...good, lane: "Made Up", profile_target: "both", recommended_format: "article" });
    expect(unknown.lane_id).toBeNull();
    expect(unknown.profile_target).toBe("BOTH");
    expect(unknown.recommended_format).toBe("ARTICLE");
  });

  it("marks a market-signal idea with its trust basis", () => {
    const g = one({ ...good, slot: 2, signals: [{ title: "Insurers slow down" }] });
    expect(g.trust_basis).toEqual(["LIVED_EXPERIENCE", "MARKET_SIGNAL"]);
    expect(g.score_breakdown.evidence).toBe(1);
  });
});

describe("the gate on refined notes", () => {
  const note = "Owners ask me about 60 day payment plans";
  it("never rejects a person's own note, and records it as the trust basis", () => {
    const [g] = gateIdeas(
      input([{ raw_idea: note, angle: "Payment plans over 60 days quietly fund your patients.", icp_problem: "", memory_refs: ["M9"] }], { mode: "refine", plan: undefined, notes: [note] })
    );
    expect(g.gate_verdict).toBe("BELOW_BAR");
    expect(g.source_type).toBe("USER_NOTE");
    expect(g.trust_basis).toEqual(["USER_NOTE"]);
    expect(g.gate_reasons.join(" ")).toMatch(/ICP/);
  });

  it("passes a note with an ICP problem, allowing figures from the note itself", () => {
    const [g] = gateIdeas(
      input([{ raw_idea: note, angle: "A 60 day payment plan is a loan you did not price.", icp_problem: "Profit on paper but no cash in the bank" }], { mode: "refine", plan: undefined, notes: [note] })
    );
    expect(g.gate_verdict).toBe("PASS");
    expect(g.score_breakdown.authority).toBe(1);
  });
});
