import { describe, expect, it } from "vitest";
import { TENANTS } from "./corpus";
import { numbersIn, scoreIdea, type Verdict } from "./rubric";

const ledger = TENANTS.find((t) => t.id === "ledgerline")!;

const yes: Verdict = {
  icp_problem: true,
  icp_problem_quote: "",
  author_advantage: true,
  author_advantage_refs: ["M2"],
  author_advantage_quote: "reimbursements arriving 47 days late",
  beyond_source: true,
  generic: false,
  invented_facts: false,
  invented_facts_quote: "",
  off_positioning: false,
  note: "",
};

const idea = (raw_idea: string) => ({ raw_idea, angle: "", why: "" });

describe("eval scoring checks the judge instead of trusting it", () => {
  it("passes an idea that carries a specific detail from memory", () => {
    const s = scoreIdea(idea("The hygienist was affordable: reimbursements arriving 47 days late made it look otherwise."), yes, 0, ledger);
    expect(s.author_advantage).toBe(true);
    expect(s.authority_pass).toBe(true);
  });

  it("rejects author advantage when the judge's quote is not in the idea", () => {
    const s = scoreIdea(idea("Dentists should watch their cash flow more closely."), yes, 0, ledger);
    expect(s.author_advantage).toBe(false);
    expect(s.authority_pass).toBe(false);
  });

  it("rejects author advantage that cites a memory item that does not exist", () => {
    const s = scoreIdea(idea("reimbursements arriving 47 days late"), { ...yes, author_advantage_refs: ["M99"] }, 0, ledger);
    expect(s.author_advantage).toBe(false);
  });

  it("rejects a quote that shares only the topic with the memory item it cites", () => {
    // M3 is about supplies running ~8% of revenue; this quote only shares "supplies".
    const s = scoreIdea(idea("Dental supplies are getting more expensive."), { ...yes, author_advantage_refs: ["M3"], author_advantage_quote: "Dental supplies are getting more expensive" }, 0, ledger);
    expect(s.author_advantage).toBe(false);
  });

  it("does not treat small structural counts as invented facts", () => {
    const s = scoreIdea(idea("Ask 3 questions before financing; reimbursements arriving 47 days late."), yes, 0, ledger);
    expect(s.unsupported_numbers).toEqual([]);
  });

  it("flags a number that appears in no memory, proof or signal, even when the judge missed it", () => {
    const s = scoreIdea(idea("Reject any loan over 15% of monthly collections; reimbursements arriving 47 days late prove it."), yes, 0, ledger);
    expect(s.unsupported_numbers).toEqual(["15"]);
    expect(s.invented).toBe(true);
    expect(s.authority_pass).toBe(false);
  });

  it("extracts numbers once, with decimal commas normalised", () => {
    expect(numbersIn("31% of 2,5 calls and 31 more")).toEqual(["31", "2.5"]);
  });
});
