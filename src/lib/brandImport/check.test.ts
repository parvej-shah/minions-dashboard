import { describe, expect, it } from "vitest";
import { applyImportEvent, EMPTY_IMPORT } from "./types";
import { bylineFromHeadline, checkExperience, checkIdentity, checkProofs, checkVoice, glimpses, parseReply, quotedIn } from "./check";

const PROFILE = `Parvej Shah
Founder at Minions AI | AI voice agents for real-estate brokerages
Dhaka, Bangladesh
Summary
I build AI voice agents that answer every buyer call for real-estate
brokerages in the US and Dubai. Before that I ran engineering for a
logistics startup and shipped a dispatch system used by 40 fleets.
Experience
Minions AI
Founder
2024 - Present`;

let n = 0;
const id = () => `id${++n}`;

describe("quotedIn", () => {
  it("matches across PDF line breaks, case and punctuation", () => {
    expect(quotedIn(PROFILE, "answer every buyer call for real-estate brokerages")).toBe(true);
    expect(quotedIn(PROFILE, "Shipped a dispatch system, used by 40 fleets!")).toBe(true);
  });
  it("refuses text the source does not have, and quotes too short to mean anything", () => {
    expect(quotedIn(PROFILE, "used by 400 fleets across Europe")).toBe(false);
    expect(quotedIn(PROFILE, "AI")).toBe(false);
  });
});

describe("checkExperience", () => {
  const sources = [{ label: "LinkedIn profile", text: PROFILE }];

  it("keeps a fact whose evidence is quoted and which adds nothing", () => {
    const items = checkExperience(
      [{ kind: "PAST_EXPERIENCE", content: "I ran engineering for a logistics startup and shipped a dispatch system used by 40 fleets.", evidence: "shipped a dispatch system used by 40 fleets" }],
      sources,
      id
    );
    expect(items).toHaveLength(1);
    expect(items[0].from).toBe("LinkedIn profile");
  });

  it("drops an item that invents a figure, a name, or has no real evidence", () => {
    const items = checkExperience(
      [
        { kind: "PAST_EXPERIENCE", content: "I shipped a dispatch system used by 400 fleets.", evidence: "shipped a dispatch system used by 40 fleets" },
        { kind: "CURRENT_WORK", content: "I build voice agents for Keller Williams offices.", evidence: "I build AI voice agents" },
        { kind: "CURRENT_WORK", content: "I build AI voice agents for brokerages.", evidence: "I build software for hospitals" },
      ],
      sources,
      id
    );
    expect(items).toEqual([]);
  });

  it("drops an item that upgrades the source's verb or writes out a figure it never states", () => {
    const items = checkExperience(
      [
        { kind: "CURRENT_WORK", content: "I pioneered AI voice agents that answer every buyer call for brokerages.", evidence: "answer every buyer call for real-estate brokerages" },
        { kind: "PAST_EXPERIENCE", content: "Over seven years I shipped a dispatch system used by 40 fleets.", evidence: "shipped a dispatch system used by 40 fleets" },
      ],
      sources,
      id
    );
    expect(items).toEqual([]);
  });

  it("never proposes stories, lessons or opinions", () => {
    const items = checkExperience(
      [{ kind: "LESSON", content: "I learned that brokerages lose buyers when calls go unanswered.", evidence: "answer every buyer call" }],
      sources,
      id
    );
    expect(items).toEqual([]);
  });
});

describe("checkProofs", () => {
  const pages = [{ url: "https://getminions.ai/", title: "Minions", text: "Our agents answer in under 2 seconds. Trusted by 12 brokerages in Dubai." }];

  it("keeps a claim the page states word for word", () => {
    const proofs = checkProofs([{ claim: "Answers calls in under 2 seconds", quote: "Our agents answer in under 2 seconds.", source_url: "https://getminions.ai/" }], pages, id);
    expect(proofs).toHaveLength(1);
    expect(proofs[0].source_url).toBe("https://getminions.ai/");
  });

  it("drops a claim whose quote is not on the page or whose numbers grew", () => {
    const proofs = checkProofs(
      [
        { claim: "SOC 2 certified platform", quote: "We are SOC 2 Type II certified.", source_url: "https://getminions.ai/" },
        { claim: "Trusted by 120 brokerages", quote: "Trusted by 12 brokerages in Dubai.", source_url: "https://getminions.ai/" },
      ],
      pages,
      id
    );
    expect(proofs).toEqual([]);
  });
});

describe("identity and voice", () => {
  it("keeps a name only when the source has it", () => {
    expect(checkIdentity({ name: "Parvej Shah", headline: "Founder" }, PROFILE)?.name).toBe("Parvej Shah");
    expect(checkIdentity({ name: "John Smith" }, PROFILE)).toBeNull();
  });

  it("keeps the About text and signature phrases only when they are the author's own words", () => {
    const voice = checkVoice(
      {
        questionnaire: { formality: "casual", sentence_length: "short", humor: "loud", emoji_use: "never", signature_phrases: ["every buyer call", "move fast and break things"] },
        about: "I build AI voice agents that answer every buyer call for real-estate brokerages in the US and Dubai.",
      },
      PROFILE
    );
    expect(voice?.questionnaire.humor).toBe("light");
    expect(voice?.questionnaire.signature_phrases).toEqual(["every buyer call"]);
    expect(voice?.about).toContain("AI voice agents");
    expect(checkVoice({ about: "A visionary leader passionate about innovation and synergy." }, PROFILE)?.about).toBeNull();
  });
});

describe("plumbing", () => {
  it("reads fenced JSON and refuses junk", () => {
    expect(parseReply('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseReply("not json")).toBeNull();
    expect(parseReply("[1,2]")).toBeNull();
  });

  it("shows real sentences in the reading feed, not headings", () => {
    const lines = glimpses(PROFILE, 3);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.length >= 30)).toBe(true);
    expect(lines).not.toContain("Experience");
  });

  it("starts each glimpse where its sentence starts, across PDF line wraps", () => {
    const lines = glimpses(PROFILE, 5);
    expect(lines).toContain("Before that I ran engineering for a logistics startup and shipped a dispatch system used by 40 fleets.");
    expect(lines.every((l) => /^[A-Z]/.test(l))).toBe(true);
  });

  it("drops a page title's leading separator", () => {
    expect(glimpses("— 24/7 AI receptionist for real estate teams who miss calls.", 1)).toEqual(["24/7 AI receptionist for real estate teams who miss calls."]);
  });

  it("leaves links and date ranges out of the reading feed", () => {
    const lines = glimpses("www.linkedin.com/in/someone-demo (LinkedIn)\nJanuary 2022 - Present (2 years 9 months)\nI build accounting automation for mid-sized finance teams.", 5);
    expect(lines).toEqual(["I build accounting automation for mid-sized finance teams."]);
  });

  it("folds streamed events into one import", () => {
    let state = applyImportEvent(EMPTY_IMPORT, { type: "experience", items: [{ id: "a", kind: "CURRENT_WORK", content: "x".repeat(30), from: "p" }] });
    state = applyImportEvent(state, { type: "experience", items: [{ id: "b", kind: "PAST_EXPERIENCE", content: "y".repeat(30), from: "p" }] });
    state = applyImportEvent(state, { type: "step", step: "voice", state: "done" });
    expect(state.experience.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("bylineFromHeadline", () => {
  it("signs covers off with the headline's first part", () => {
    expect(bylineFromHeadline("Founder at Minions.AI | Building AI Voice Agents for Sales & Business Operations")).toBe("Founder at Minions.AI");
    expect(bylineFromHeadline("Head of Growth · Acme")).toBe("Head of Growth");
    expect(bylineFromHeadline("  Staff Engineer  ")).toBe("Staff Engineer");
  });

  it("gives nothing for an empty or overlong headline", () => {
    expect(bylineFromHeadline("")).toBeUndefined();
    expect(bylineFromHeadline(null)).toBeUndefined();
    expect(bylineFromHeadline("x".repeat(91))).toBeUndefined();
  });
});
