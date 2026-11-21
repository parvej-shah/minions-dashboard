import { describe, expect, it } from "vitest";
import { hookFor, hookOptions } from "@/lib/drafts/strategy";
import { buildDraftAuthorContext } from "@/lib/drafts/authorContext";
import { renderStrategist } from "@/lib/prompts/strategist";
import { draftAuthor } from "@/test/n8n/fixtures";

// Task 113 phase 2: one source type used to get one opening, forever.
const SOURCES = ["PAST_EXPERIENCE", "CURRENT_WORK", "BUILD_IN_PUBLIC", "PROFESSIONAL_OPINION", "USER_NOTE", "EXPERIMENT", "ICP_QUESTION", "MARKET_SIGNAL", null];

describe("hookFor rotates the opening", () => {
  it.each(SOURCES)("4 drafts in a row from %s open at least 3 different ways", (sourceType) => {
    const archetypes = [0, 1, 2, 3].map((turn) => hookFor({ sourceType }, turn).archetype);
    expect(new Set(archetypes).size).toBeGreaterThanOrEqual(3);
  });

  it("keeps today's opening on the first turn", () => {
    expect(
      ["PAST_EXPERIENCE", "CURRENT_WORK", "PROFESSIONAL_OPINION", "USER_NOTE", "EXPERIMENT", "ICP_QUESTION", "MARKET_SIGNAL", null].map((s) => hookFor({ sourceType: s }).archetype)
    ).toEqual(["AUTHOR SCENE", "WORK IN PROGRESS", "POSITION", "POSITION", "WHAT WE ARE TESTING", "THE QUESTION", "WHAT CHANGED", "READER SCENE"]);
    expect(hookFor({ sourceType: null, lanePurpose: "DEMAND" }).archetype).toBe("THE DECISION");
  });

  it("never opens on the author's own scene without lived experience", () => {
    for (const sourceType of SOURCES)
      for (const lanePurpose of [null, "DEMAND", "AUTHORITY"])
        for (let turn = 0; turn < 8; turn++) expect(hookFor({ sourceType, lanePurpose, lived: false }, turn).archetype).not.toBe("AUTHOR SCENE");
    for (const sourceType of SOURCES.filter((s) => s !== "PAST_EXPERIENCE"))
      expect(hookOptions({ sourceType }).map((h) => h.archetype)).not.toContain("AUTHOR SCENE");
  });

  it("wraps around the list", () => {
    const n = hookOptions({ sourceType: "PAST_EXPERIENCE" }).length;
    expect(hookFor({ sourceType: "PAST_EXPERIENCE" }, n).archetype).toBe("AUTHOR SCENE");
  });
});

describe("the draft context passes the turn", () => {
  const idea = { sourceType: "PAST_EXPERIENCE", trustBasis: ["LIVED_EXPERIENCE"], icpProblem: null, readerContext: null, authorAdvantage: null, whiteSpace: null, freshPerspective: null, vision: null, recommendedFormat: "POST", pillar: null };
  const icp = draftAuthor.icp;
  const memory = [{ kind: "STORY", text: "We lost a booking.", disclosure: "PUBLIC" as const }];

  it("a later turn gets a different opening", () => {
    expect(buildDraftAuthorContext(idea, memory, icp, null, "", 0).hook.archetype).toBe("AUTHOR SCENE");
    expect(buildDraftAuthorContext(idea, memory, icp, null, "", 1).hook.archetype).not.toBe("AUTHOR SCENE");
  });

  it("a past-experience idea whose memory is gone never opens on the author's scene", () => {
    expect(buildDraftAuthorContext(idea, [], icp, null, "", 0).hook.archetype).not.toBe("AUTHOR SCENE");
  });
});

describe("the strategist sees the openings already used", () => {
  const render = (recent_openings: string[]) =>
    renderStrategist({ brand_name: "Acme", target: { idea_id: "IDEA-1" }, brand_context: "ctx", author: { ...draftAuthor, recent_openings } });

  it("lists them as data and asks for a different first word and shape", () => {
    const p = render(["Most teams think the voice agent is the hard part."]);
    expect(p.messages[1].content).toMatch(/RECENT OPENINGS[\s\S]*Most teams think the voice agent/);
    expect(p.messages[0].content).toMatch(/RECENT OPENINGS[\s\S]*different first word/);
  });

  it("says nothing when the workspace has no posts yet", () => {
    const p = render([]);
    expect(p.messages[1].content).not.toMatch(/RECENT OPENINGS/);
    expect(p.messages[0].content).not.toMatch(/RECENT OPENINGS/);
  });
});
