import { describe, it, expect } from "vitest";
import { parseTopics, resolveTopics, FALLBACK_TOPICS } from "./topics";

describe("parseTopics", () => {
  it("splits the core_themes directive an AI tenant actually stored", () => {
    // Verbatim from brand_directives for cmtvl4wh700007soq65rxym5o.
    expect(
      parseTopics(
        "AI Agents & Workflows, MCP & Context Protocol, Multi-Agent Orchestration, " +
          "LLM Infrastructure & Evaluation, Real-World AI Adoption, Tool Use & Function Calling, " +
          "Developer Productivity."
      )
    ).toEqual([
      "AI Agents & Workflows",
      "MCP & Context Protocol",
      "Multi-Agent Orchestration",
      "LLM Infrastructure & Evaluation",
      "Real-World AI Adoption",
      "Tool Use & Function Calling",
      // The trailing period must not survive into the label.
      "Developer Productivity",
    ]);
  });

  it("returns nothing for an unset directive", () => {
    expect(parseTopics(null)).toEqual([]);
    expect(parseTopics("")).toEqual([]);
  });

  it("dedupes case-insensitively but keeps the operator's capitalization", () => {
    expect(parseTopics("Operations, operations, OPERATIONS")).toEqual(["Operations"]);
  });

  it("drops a run-on sentence rather than making it a filter chip", () => {
    const prose = "We write about the way that modern teams adopt automation tooling over time";
    expect(parseTopics(`Operations, ${prose}`)).toEqual(["Operations"]);
  });
});

describe("resolveTopics", () => {
  it("keeps a label an idea still uses after it left core_themes", () => {
    // Otherwise that idea becomes unfilterable and looks deleted -- the exact
    // failure the hardcoded trade list produced.
    expect(resolveTopics("Voice AI", ["Systems Architecture"])).toEqual([
      "Voice AI",
      "Systems Architecture",
    ]);
  });

  it("does not duplicate a label present in both sources", () => {
    expect(resolveTopics("Voice AI, Operations", ["Operations", null, "  "])).toEqual([
      "Voice AI",
      "Operations",
    ]);
  });

  it("falls back only when the tenant has neither themes nor stored labels", () => {
    expect(resolveTopics(null, [])).toEqual(FALLBACK_TOPICS);
    expect(resolveTopics(null, ["HVAC"])).toEqual(["HVAC"]);
  });
});
