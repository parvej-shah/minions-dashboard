import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { renderCarousel, type CarouselInput } from "@/lib/prompts/carousel";
import { checkPlan, parsePlan, quantities, suggestCarousel, toDeck, type PlanSources } from "./plan";

const body = "Demos run in controlled environments. On a live call, two seconds of silence and the buyer hangs up. Test latency on live calls before you buy.";
const sources: PlanSources = { texts: [body], memory: ["We lost a showing because the calendar write failed silently."], banned: ["game changer"] };

const good = {
  structure: "CHECKLIST",
  label: "Voice AI demos",
  cover: { headline: "Test your voice agent on live calls, not demos", emphasis: "live", kicker: "What a scripted demo cannot show you." },
  slides: [
    { layout: "STAKES", statement: "A demo runs in a quiet room. Your buyers call from the car.", emphasis: "quiet" },
    { layout: "POINT", title: "Demos hide the delays live calls expose", body: "Controlled environments mask network and lookup time." },
    { layout: "POINT", title: "Silence on a live call reads as a dropped line", body: "The buyer hangs up and the lead goes cold." },
    { layout: "CHECKLIST", title: "Before you buy", items: ["Call it from a real phone", "Time the first reply", "Book a real showing"] },
    { layout: "CLOSE", takeaway: "Judge the agent on live calls, not demos.", save_line: "Save this for your next vendor demo." },
  ],
  caption: "Your voice AI demo went perfectly. Your first live call did not.\n\nDemos run in controlled rooms. Buyers call from cars, with noise and patience measured in seconds.\n\nHere is what to test before you trust one with your leads.",
  document_title: "Test voice AI on live calls",
};

const plan = (over: Record<string, unknown> = {}) => parsePlan(JSON.stringify({ ...good, ...over })).plan!;
const author = { name: "Parvej Shah", role: "Founder" };

describe("carousel plan gates", () => {
  it("passes a well-formed plan, and every slide fits", () => {
    const p = plan();
    expect(parsePlan(JSON.stringify(good)).errors).toEqual([]);
    expect(checkPlan(p, sources)).toEqual([]);
    expect(toDeck(p, { author, brand: DEFAULT_COVER_BRAND }).errors).toEqual([]);
  });

  it("reads a stored plan sent back by the review screen", () => {
    const stored = plan();
    expect(parsePlan(JSON.stringify(stored)).plan).toEqual(stored);
  });

  it("suggests a carousel only for drafts with separate points", () => {
    const para = "This paragraph makes one separate point about live voice calls and bookings.";
    expect(suggestCarousel(Array(14).fill(para).join("\n\n")).yes).toBe(true);
    expect(suggestCarousel(para).yes).toBe(false);
    expect(suggestCarousel(Array(15).fill(para).join(" ")).yes).toBe(false);
  });

  it("rejects unreadable replies and unknown layouts", () => {
    expect(parsePlan("not json").errors).toEqual(["The reply was not valid JSON."]);
    expect(parsePlan(JSON.stringify({ ...good, slides: [{ layout: "MEME" }] })).errors[0]).toMatch(/does not exist/);
  });

  it("holds the shape: slide count, CLOSE last, no lone STEP", () => {
    expect(checkPlan(plan({ slides: good.slides.slice(0, 2) }), sources).join()).toMatch(/4 to 9 slides/);
    expect(checkPlan(plan({ slides: [...good.slides.slice(0, 4), good.slides[1]] }), sources).join()).toMatch(/last slide must be CLOSE/);
    const lone = [good.slides[0], { layout: "STEP", title: "Only step here" }, ...good.slides.slice(1)];
    expect(checkPlan(plan({ slides: lone }), sources).join()).toMatch(/single STEP/);
  });

  it("counts words per field", () => {
    const long = { layout: "POINT", title: "This title runs on far past the twelve words a slide title may ever hold" };
    expect(checkPlan(plan({ slides: [good.slides[0], long, ...good.slides.slice(2)] }), sources).join()).toMatch(/title has 15 words; the most is 12/);
  });

  it("allows figures and quotes only from the sources", () => {
    const invented = { layout: "NUMBER", value: "40", unit: "%", caption: "of leads call after hours." };
    expect(checkPlan(plan({ slides: [good.slides[0], invented, ...good.slides.slice(1)] }), sources).join()).toMatch(/not stated in the draft/);
    const quote = { layout: "QUOTE", quote: "Voice AI will replace every agent by next year." };
    expect(checkPlan(plan({ slides: [good.slides[0], quote, ...good.slides.slice(1)] }), sources).join()).toMatch(/author's own words/);
    const real = { layout: "QUOTE", quote: "We lost a showing because the calendar write failed silently." };
    expect(checkPlan(plan({ slides: [good.slides[0], real, ...good.slides.slice(1)] }), sources)).toEqual([]);
    expect(checkPlan(plan({ caption: good.caption + " It lifts bookings 37%." }), sources).join()).toMatch(/figures the draft does not: 37/);
  });

  it("blocks banned phrases, dashes, repeats and engagement bait", () => {
    expect(checkPlan(plan({ document_title: "A game changer for demos" }), sources).join()).toMatch(/banned phrases/);
    expect(checkPlan(plan({ caption: good.caption.replace("Demos run", "Demos — run") }), sources).join()).toMatch(/dashes/);
    const repeat = { layout: "POINT", title: "Demos hide the delays that live calls expose" };
    expect(checkPlan(plan({ slides: [...good.slides.slice(0, 2), repeat, ...good.slides.slice(2)] }), sources).join()).toMatch(/same point/);
    expect(checkPlan(plan({ caption: good.caption + ' Comment "DEMO" below for the checklist.' }), sources).join()).toMatch(/engagement bait/);
    expect(checkPlan(plan({ caption: good.caption + "\n\n#VoiceAI #RealEstate" }), sources)).toEqual([]);
    expect(checkPlan(plan({ caption: "## Heading\n\n" + good.caption }), sources).join()).toMatch(/markdown/);
  });
});

describe("unverified claims", () => {
  const unverified = ["On a real call, two seconds of silence is the threshold where buyers assume the line dropped"];
  const withClaims = { ...sources, unverified };

  it("blocks a slide or caption that states an unverified claim's figure as fact", () => {
    const slide = { layout: "STEP", title: "Measure response time", body: "Two seconds of silence is the threshold where buyers assume the line dropped." };
    const steps = [good.slides[0], slide, { layout: "STEP", title: "Book a real showing" }, good.slides[4]];
    expect(checkPlan(plan({ structure: "STEPS", slides: steps }), withClaims).join()).toMatch(/unverified claim with its figure/);
    expect(checkPlan(plan({ caption: good.caption + " Systems must answer within two seconds or the buyer hangs up." }), withClaims).join()).toMatch(/unverified claim/);
  });

  it("reads a figure with its unit however it is spelled", () => {
    expect(quantities("two seconds of silence, 30 percent of calls, 2 seconds")).toEqual(["2 second", "30 %"]);
  });

  it("allows the idea without the figure, and figures unrelated to the claim", () => {
    const hedged = { layout: "POINT", title: "Silence on a live call reads as a dropped line", body: "Every pause is a chance for the buyer to hang up." };
    expect(checkPlan(plan({ slides: [good.slides[0], good.slides[1], hedged, ...good.slides.slice(3)] }), withClaims)).toEqual([]);
    expect(checkPlan(plan(), withClaims)).toEqual([]);
  });
});

describe("carousel prompt", () => {
  const input: CarouselInput = {
    brand_name: "Parvej Shah",
    author_name: "Parvej Shah",
    title: "Why your AI voice demo fails on live calls",
    hook: "AI demos move fast. Real buyers hang up if your system lags.",
    core_argument: "A flawless demo hides latency.",
    body,
    icp: { who: "Real estate brokerage owners", role: "Broker" },
    memory: sources.memory,
    evidence_rules: ["You may write in the first person about the AUTHOR'S EXPERIENCE listed, and only about that."],
    banned: sources.banned,
    unverified: ["Two seconds of silence is the threshold where buyers assume the line dropped"],
  };

  // A golden diff in review IS the prompt change: UPDATE_GOLDEN=1 npx vitest run src/lib/carousel
  it("matches its golden", () => {
    const file = path.join(process.cwd(), "src/test/n8n/golden/carousel.json");
    const actual = renderCarousel(input);
    if (process.env.UPDATE_GOLDEN === "1") fs.writeFileSync(file, JSON.stringify(actual, null, 2) + "\n");
    expect(actual).toEqual(JSON.parse(fs.readFileSync(file, "utf8")));
  });

  it("sends the gate failures back on the retry", () => {
    const retry = renderCarousel({ ...input, feedback: ["Slide 3 (POINT): title has 15 words; the most is 12."] });
    expect(retry.messages[1].content).toContain("Your previous plan failed these checks");
    expect(retry.messages[1].content).toContain("title has 15 words");
  });
});
