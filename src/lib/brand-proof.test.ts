import { describe, expect, it } from "vitest";
import { parseBrandProof, serializeBrandProof } from "./brand-proof";

describe("brand proof serialization", () => {
  it("round-trips an approved sourced claim", () => {
    const stored = serializeBrandProof({
      claim: "Customers reduced response time by 25%.",
      sourceUrl: "https://example.com/case-study",
      sourceTitle: "Customer case study",
      notes: "Measured over 30 days",
    });

    expect(parseBrandProof(stored)).toEqual({
      claim: "Customers reduced response time by 25%.",
      sourceUrl: "https://example.com/case-study",
      sourceTitle: "Customer case study",
      notes: "Measured over 30 days",
      approved: true,
    });
  });

  it("rejects malformed, unapproved, and unsafe proof entries", () => {
    expect(parseBrandProof("not-json")).toBeNull();
    expect(parseBrandProof(JSON.stringify({ claim: "A claim", sourceUrl: "https://example.com", approved: false }))).toBeNull();
    expect(parseBrandProof(JSON.stringify({ claim: "A claim", sourceUrl: "javascript:alert(1)", approved: true }))).toBeNull();
  });
});
