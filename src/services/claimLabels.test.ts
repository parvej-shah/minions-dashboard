import { describe, expect, it, vi } from "vitest";
import { labelClaims } from "./claimLabels";

const draft = { hook: "Hook", body: "Body" };
const claims = [
  { claim_text: "Every missed window leaks one contract per week", claim_type: "OPINION" },
  { claim_text: "We cut onboarding from 14 steps to 3", claim_type: "STATISTIC" },
];

describe("labelClaims", () => {
  it("takes Jev's label for each claim", async () => {
    const ask = vi.fn().mockResolvedValue({ c0: { type: "choice", choice: "STATISTIC" }, c1: { type: "choice", choice: "CUSTOMER_RESULT" } });
    const out = await labelClaims(draft, claims, ask);
    expect(out.map((c) => c.claim_type)).toEqual(["STATISTIC", "CUSTOMER_RESULT"]);
    expect(Object.keys(ask.mock.calls[0][1])).toEqual(["c0", "c1"]);
  });

  it("keeps the editor's label when Jev is unavailable or answers outside the set", async () => {
    expect(await labelClaims(draft, claims, vi.fn().mockResolvedValue(null))).toEqual(claims);
    const out = await labelClaims(draft, claims, vi.fn().mockResolvedValue({ c0: { type: "choice", choice: "RUMOUR" } }));
    expect(out.map((c) => c.claim_type)).toEqual(["OPINION", "STATISTIC"]);
  });

  it("does not call Jev when there is nothing to label", async () => {
    const ask = vi.fn();
    expect(await labelClaims(draft, [{ claim_text: " " }], ask)).toEqual([{ claim_text: " " }]);
    expect(ask).not.toHaveBeenCalled();
  });
});
