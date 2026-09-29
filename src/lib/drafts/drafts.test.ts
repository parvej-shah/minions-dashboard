import { describe, expect, it } from "vitest";
import { allowedContentModes, hookFor, resolveContentMode } from "./strategy";
import { generalizedText, leakedSpecifics, redact } from "./generalize";
import { checkDraft, type DraftCheckInput } from "./check";
import { measure, readabilityIssues, reflowParagraphs } from "./readability";
import { buildDraftAuthorContext, evidenceRules } from "./authorContext";
import { EMPTY_ICP } from "@/services/authorContext";

describe("the hook follows what the idea rests on, not the pillar's name", () => {
  it("picks by source type first", () => {
    expect(hookFor({ sourceType: "PAST_EXPERIENCE", lanePurpose: "DEMAND" }).archetype).toBe("AUTHOR SCENE");
    expect(hookFor({ sourceType: "CURRENT_WORK" }).archetype).toBe("WORK IN PROGRESS");
    expect(hookFor({ sourceType: "PROFESSIONAL_OPINION" }).archetype).toBe("POSITION");
    expect(hookFor({ sourceType: "EXPERIMENT" }).archetype).toBe("WHAT WE ARE TESTING");
  });

  it("opens a DEMAND lane on the decision, and falls back to the source", () => {
    expect(hookFor({ sourceType: "ICP_QUESTION", lanePurpose: "DEMAND" }).archetype).toBe("THE DECISION");
    expect(hookFor({ sourceType: "ICP_QUESTION", lanePurpose: "AUTHORITY" }).archetype).toBe("THE QUESTION");
    expect(hookFor({ sourceType: "MARKET_SIGNAL" }).archetype).toBe("WHAT CHANGED");
  });

  it("matches an older idea's angle exactly, never by substring", () => {
    expect(hookFor({ pillar: "The Myth" }).archetype).toBe("INVERSION");
    expect(hookFor({ pillar: "The Stakes" }).archetype).toBe("DIRECT COST");
    // "Systems Architecture" used to match INVERSION through "architecture".
    expect(hookFor({ pillar: "Systems Architecture" }).archetype).toBe("READER SCENE");
  });
});

describe("content modes the evidence can carry", () => {
  it("allows STORY only with lived experience or the author's own note", () => {
    expect(allowedContentModes([])).not.toContain("STORY");
    expect(allowedContentModes(["LIVED_EXPERIENCE"])).toContain("STORY");
    expect(allowedContentModes(["USER_NOTE"])).toContain("STORY");
    expect(allowedContentModes(["MARKET_SIGNAL"])).not.toContain("CASE_NOTE");
  });

  it("moves a mode the evidence cannot carry to the nearest honest one", () => {
    expect(resolveContentMode("STORY", [])).toBe("OPINION");
    expect(resolveContentMode("CASE_NOTE", ["MARKET_SIGNAL"])).toBe("INSIGHT");
    expect(resolveContentMode("story", ["LIVED_EXPERIENCE"])).toBe("STORY");
  });

  it("forbids first-person experience in the rules when there is none", () => {
    const none = buildDraftAuthorContext({ sourceType: "MARKET_SIGNAL", trustBasis: ["MARKET_SIGNAL"], icpProblem: "x", readerContext: null, authorAdvantage: "old", whiteSpace: null, freshPerspective: null, vision: null, recommendedFormat: null, pillar: null }, [], EMPTY_ICP, null, "");
    expect(evidenceRules(none)[0]).toMatch(/never write first-person/);
    expect(none.author_advantage).toBe("");
    expect(none.recommended_format).toBe("ARTICLE");
  });

  it("drops LIVED_EXPERIENCE when every cited item is gone", () => {
    const ctx = buildDraftAuthorContext({ sourceType: "PAST_EXPERIENCE", trustBasis: ["LIVED_EXPERIENCE"], icpProblem: "x", readerContext: null, authorAdvantage: "a", whiteSpace: null, freshPerspective: null, vision: null, recommendedFormat: "POST", pillar: null }, [], EMPTY_ICP, null, "");
    expect(ctx.trust_basis).toEqual([]);
    expect(ctx.allowed_modes).not.toContain("STORY");
  });
});

describe("Generalize items reach the draft as their lesson only", () => {
  const original = "At Brightsmile Dental in Austin, reimbursements arrived 47 days late and cost $12,000.";

  it("finds every specific the rewrite kept", () => {
    expect(leakedSpecifics(original, "Reimbursements at Brightsmile arrived 47 days late.")).toEqual(["Brightsmile", "47"]);
    expect(leakedSpecifics(original, "At one practice, insurance payments arrived weeks late.")).toEqual([]);
  });

  it("uses the model's rewrite only when code confirms it is clean", () => {
    expect(generalizedText(original, "At one practice, insurance payments arrived weeks late.")).toEqual({ text: "At one practice, insurance payments arrived weeks late.", by: "model" });
    const fallback = generalizedText(original, "Brightsmile paid 47 days late.");
    expect(fallback.by).toBe("code");
    expect(leakedSpecifics(original, fallback.text)).toEqual([]);
  });

  it("redacts names, figures and links in code", () => {
    const r = redact("See https://x.example: Brightsmile Dental lost $12,000 and 30% of 47 claims.");
    expect(r).not.toMatch(/Brightsmile|12,000|30|47|https/);
  });
});

describe("the draft check", () => {
  const base: DraftCheckInput = {
    hook: "A cold snap does not break heaters.",
    body: "## What We Saw\nWe replaced 14 water heaters in one January week.\n\nThe cold only exposed tanks already failing.",
    claims: [],
    approvedProofs: [{ claim: "Acme holds an Ohio master plumber license", sourceUrl: "https://ohio.example/license" }],
    allowCustomerResult: false,
    trustBasis: ["LIVED_EXPERIENCE"],
    memory: [{ content: "Replaced 14 water heaters in one January week after a cold snap.", disclosure: "PUBLIC", generalizedContent: null }],
    knownText: [],
  };

  it("passes a draft that states only what its inputs support", () => {
    expect(checkDraft(base)).toMatchObject({ claims_ok: "Y", reasons: [] });
  });

  it("blocks an invented statistic, even when the editor called it an opinion", () => {
    const r = checkDraft({ ...base, body: base.body + "\n\nA yearly flush could cut failures by 40%.", claims: [{ claim_text: "A yearly flush could cut failures by 40%.", claim_type: "OPINION" }] });
    expect(r.claims_ok).toBe("BLOCKED");
    expect(r.reasons.join(" ")).toMatch(/40/);
  });

  it("does not treat a year as a statistic", () => {
    expect(checkDraft({ ...base, body: base.body + "\n\nIn 2026 the codes changed." }).claims_ok).toBe("Y");
  });

  it("sources a claim to the author's own experience", () => {
    const r = checkDraft({ ...base, claims: [{ claim_text: "We replaced 14 water heaters in one January week", claim_type: "FACT" }] });
    expect(r.claims[0]).toMatchObject({ verified: "Y", source_title: "The author's own experience" });
    expect(r.claims_ok).toBe("Y");
  });

  it("verifies a claim against approved proof, and flags an unbacked one for review", () => {
    const r = checkDraft({ ...base, claims: [{ claim_text: "Acme holds an Ohio master plumber license", claim_type: "FACT" }, { claim_text: "Most heaters fail in winter", claim_type: "MARKET_CLAIM" }] });
    expect(r.claims[0]).toMatchObject({ verified: "Y", source_url: "https://ohio.example/license" });
    expect(r.claims[1].verified).toBe("N");
    expect(r.claims_ok).toBe("N");
  });

  it("blocks a customer result with nothing behind it", () => {
    const r = checkDraft({ ...base, trustBasis: [], memory: [], body: "Tanks fail.", claims: [{ claim_text: "One customer saved a fortune", claim_type: "CUSTOMER_RESULT" }] });
    expect(r.claims_ok).toBe("BLOCKED");
  });

  it("blocks a draft that uses a Generalize item's specifics", () => {
    const r = checkDraft({ ...base, memory: [{ content: "Brightsmile Dental paid 47 days late.", disclosure: "GENERALIZE", generalizedContent: "One practice was paid weeks late." }], body: "Brightsmile was paid late." });
    expect(r.claims_ok).toBe("BLOCKED");
    expect(r.reasons.join(" ")).toMatch(/Generalize.*Brightsmile/);
  });

  it("flags first-person experience when the idea rests on none", () => {
    const r = checkDraft({ ...base, trustBasis: ["MARKET_SIGNAL"], memory: [], body: "When we wired this up, calls dropped." });
    expect(r.claims_ok).toBe("N");
    expect(r.reasons.join(" ")).toMatch(/first-person/);
  });
});

describe("the draft check keeps a retold experience to what the item says", () => {
  // From a real draft (2026-09-29): one story, retold with details and an outcome it never stated.
  const story = "Redesigned the website for Carolyn Greiner, a Learning & Development leader. The goals: a cleaner user experience, better content hierarchy, and showing her expertise with more clarity and credibility.";
  const founder = "A founder asked for a complete website redesign because the site 'looked outdated'. We reviewed their analytics and user recordings: the visuals were fine, but the main CTA was buried in jargon.";
  const base: DraftCheckInput = {
    hook: "Raising prices exposes a weak content hierarchy.",
    body: "In Carolyn Greiner's redesign we rebuilt the content hierarchy so her expertise landed with clarity and credibility.\n\nLook at your hero section right now.",
    claims: [],
    approvedProofs: [],
    allowCustomerResult: false,
    trustBasis: ["LIVED_EXPERIENCE"],
    memory: [{ content: story, disclosure: "PUBLIC", generalizedContent: null }],
    knownText: [],
    authorFacts: ["Brand and web strategist for coaches.", "Designed more than 400 brands"],
  };

  it("passes a faithful retelling", () => {
    const claims = [{ claim_text: "The goals were a cleaner user experience, better content hierarchy, and showing her expertise with more clarity and credibility.", claim_type: "CUSTOMER_RESULT" }];
    expect(checkDraft({ ...base, claims })).toMatchObject({ claims_ok: "Y", reasons: [] });
  });

  it("flags a detail the item never stated", () => {
    const claims = [{ claim_text: "In Carolyn's case, the goal was better content hierarchy and her expertise with more clarity and credibility. No new logo. No palette shift.", claim_type: "CUSTOMER_RESULT" }];
    const r = checkDraft({ ...base, claims });
    expect(r.claims_ok).toBe("N");
    expect(r.reasons.join(" ")).toMatch(/does not state: "No new logo\. No palette shift\."/);
  });

  it("flags an outcome the item never stated", () => {
    const r = checkDraft({ ...base, body: base.body + "\n\nThe result? A clearer user experience, stronger trust, and more discovery calls." });
    expect(r.claims_ok).toBe("N");
    expect(r.reasons.join(" ")).toMatch(/outcome/);
  });

  it("passes an outcome the item does state", () => {
    const r = checkDraft({ ...base, body: base.body + "\n\nThe result: a cleaner user experience and better content hierarchy." });
    expect(r.claims_ok).toBe("Y");
  });

  it("leaves advice about outcomes alone", () => {
    const r = checkDraft({ ...base, body: base.body + "\n\nA small shift in clarity can drive more discovery calls than a full redesign." });
    expect(r.claims_ok).toBe("Y");
  });

  it("flags one story told as many", () => {
    const r = checkDraft({ ...base, memory: [{ content: founder, disclosure: "PUBLIC", generalizedContent: null }], body: "In over 400 brand projects, I've stopped clients from wasting months of budget." });
    expect(r.claims_ok).toBe("N");
    expect(r.reasons.join(" ")).toMatch(/one experience as many \("I've stopped clients"\)/);
  });

  it("allows many when the author's own facts say so", () => {
    const r = checkDraft({ ...base, body: "I've designed brands for coaches, and the pattern repeats." });
    expect(r.claims_ok).toBe("Y");
  });

  it("leaves consequences and general counts alone", () => {
    const r = checkDraft({ ...base, body: base.body + "\n\nThe result: sales teams chase stale leads.\n\nMost CRMs hold hundreds of records nobody reads." });
    expect(r.claims_ok).toBe("Y");
  });

  it("does not look for outcomes in a draft with no experience behind it", () => {
    const r = checkDraft({ ...base, trustBasis: ["MARKET_SIGNAL"], memory: [], body: "Most sites bury the offer.\n\nThe result? More bounces and fewer calls." });
    expect(r.reasons.join(" ")).not.toMatch(/outcome/);
  });

  it("flags a count said in words that no item gives", () => {
    const r = checkDraft({ ...base, body: "After diagnosing hundreds of sites, I know the leak is the hero." });
    expect(r.claims_ok).toBe("N");
    expect(r.reasons.join(" ")).toMatch(/hundreds of sites/);
  });
});

describe("readability", () => {
  it("measures what a phone reader feels", () => {
    const long = Array.from({ length: 35 }, () => "word").join(" ") + ".";
    const r = measure("x".repeat(250), `## Head\nOne. Two. Three. Four.\n\n${long}`);
    expect(r).toMatchObject({ headings: 1, paragraphs: 2, long_paragraphs: 1, long_sentences: 1, hook_chars: 250 });
    expect(readabilityIssues(r)).toHaveLength(3);
  });
});

describe("paragraph reflow", () => {
  const long = (w: string) => `${w} is a sentence long enough to stand alone.`;
  it("splits an over-long paragraph without changing a word", () => {
    const p = [1, 2, 3, 4].map((i) => long(`S${i}`)).join(" ");
    const out = reflowParagraphs(`${p}\n\nA. B.`);
    expect(out.split("\n\n")).toHaveLength(3);
    expect(out.replace(/\s+/g, " ")).toBe(`${p} A. B.`);
    expect(out.split("\n\n").every((g) => g.split(/(?<=\.)\s/).length <= 3)).toBe(true);
  });

  it("keeps short fragments together", () => {
    const out = reflowParagraphs(`${long("First")} No alert. No retry. Just a ghost. ${long("Last")}`);
    expect(out).toContain("No alert. No retry. Just a ghost.");
    // The run cannot join either long neighbour without passing 3 sentences, so it stands alone.
    expect(out.split("\n\n")).toHaveLength(3);
  });

  it("keeps a heading on top of its first group, and leaves lists alone", () => {
    const p = [1, 2, 3, 4].map((i) => long(`S${i}`)).join(" ");
    expect(reflowParagraphs(`## Why\n${p}`).startsWith(`## Why\n${long("S1")}`)).toBe(true);
    const list = "- One. Two.\n- Three. Four.\n- Five.";
    expect(reflowParagraphs(list)).toBe(list);
  });
});

describe("the draft check sources claims to supplied signals", () => {
  it("verifies a claim a supplied source states, with its URL", () => {
    const r = checkDraft({
      hook: "h",
      body: "A new speech model promises faster turn-taking for phone agents.",
      claims: [{ claim_text: "A new speech model release promises faster turn-taking for phone agents", claim_type: "FACT" }],
      approvedProofs: [],
      allowCustomerResult: false,
      trustBasis: ["MARKET_SIGNAL"],
      memory: [],
      knownText: [],
      sources: [{ title: "Speech model promises faster turn-taking", text: "The release targets phone agents.", url: "https://news.example/s" }],
    });
    expect(r.claims[0]).toMatchObject({ verified: "Y", source_url: "https://news.example/s" });
    expect(r.claims_ok).toBe("Y");
  });
});
