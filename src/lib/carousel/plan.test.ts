import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { renderCarousel, type CarouselInput } from "@/lib/prompts/carousel";
import { checkPlan, namesIn, parsePlan, quantities, repairPlan, suggestCarousel, toDeck, WORD_CAPS, type PlanSources } from "./plan";
import { SLIDE_STYLES } from "./slides";

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

  it("keeps the model's design, and gives a plan stored without one the original design", () => {
    expect(plan({ style: "bold" }).style).toBe("BOLD");
    expect(plan().style).toBe("EDITORIAL");
    expect(parsePlan(JSON.stringify({ ...good, style: "NEON" })).errors).toContain("style must be one of EDITORIAL, BOLD, MINIMAL, POSTER, SWISS, AURORA, BENTO.");
  });

  it("keeps known icons, and drops unknown, repeated or misplaced ones without failing the plan", () => {
    const slides = [
      { layout: "STAKES", statement: "A demo runs in a quiet room.", icon: "phone-call" },
      { layout: "POINT", title: "Demos hide the delays", icon: "unicorn" },
      { layout: "POINT", title: "Silence reads as a dropped line", icon: "PHONE_CALL" },
      { layout: "STEP", title: "Time the first reply", icon: "Clock" },
      { layout: "CLOSE", takeaway: "Judge it on live calls.", icon: "CLOCK" },
    ];
    const { plan: p, errors } = parsePlan(JSON.stringify({ ...good, slides }));
    expect(errors).toEqual([]);
    expect(p!.slides.map((x) => ("icon" in x ? x.icon : undefined))).toEqual(["PHONE_CALL", undefined, undefined, "CLOCK", undefined]);
  });

  it("reads GRID and PUNCH slides, dropping unknown tile icons to a default", () => {
    const slides = [
      good.slides[0],
      { layout: "GRID", title: "What to test", items: [{ label: "Latency", icon: "clock" }, { label: "Noise", icon: "nope" }, { label: "Booking", icon: "CALENDAR_BLANK" }] },
      { layout: "PUNCH", lines: ["Demo: quiet room.", "Live: a car.", "Buyer: gone."], checks: ["Call from a real phone"] },
      good.slides[4],
    ];
    const { plan: p, errors } = parsePlan(JSON.stringify({ ...good, slides }));
    expect(errors).toEqual([]);
    expect(p!.slides[1]).toEqual({ layout: "GRID", title: "What to test", items: [{ label: "Latency", icon: "CLOCK" }, { label: "Noise", icon: "LIGHTBULB" }, { label: "Booking", icon: "CALENDAR_BLANK" }] });
    expect(p!.slides[2]).toEqual({ layout: "PUNCH", lines: ["Demo: quiet room.", "Live: a car.", "Buyer: gone."], checks: ["Call from a real phone"] });
  });

  it("opens with the post's own cover when one is given", () => {
    const cover = { layout: "STATEMENT" as const, headline: "Test voice agents on live calls", author, brand: DEFAULT_COVER_BRAND };
    expect(toDeck(plan(), { author, brand: DEFAULT_COVER_BRAND, cover }).deck.cover.layout).toBe("STATEMENT");
    expect(toDeck(plan(), { author, brand: DEFAULT_COVER_BRAND }).deck.cover.layout).toBe("HEADLINE");
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

  it("counts words per field, letting a field run a word or two over", () => {
    const long = { layout: "POINT", title: "This title runs on far past the twelve words a slide title may ever hold" };
    expect(checkPlan(plan({ slides: [good.slides[0], long, ...good.slides.slice(2)] }), sources).join()).toMatch(/title has 15 words; the most is 14/);
    const oneOver = { layout: "STEP", title: "Call it", body: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two calls." };
    const steps = [good.slides[0], oneOver, { layout: "STEP", title: "Time the reply" }, ...good.slides.slice(3)];
    expect(checkPlan(plan({ slides: steps }), sources).join()).not.toMatch(/words/);
  });

  it("repairs what the model gets wrong mechanically, and cuts no wording", () => {
    const messy = plan({
      caption: good.caption.replace("Demos run", "Demos — run"),
      slides: [
        { layout: "CLOSE", takeaway: "Judge the agent on live calls, not demos." },
        good.slides[0],
        { layout: "STEP", title: "Call it from a **real** phone" },
        { layout: "NUMBER", value: "40", unit: "%", caption: "of leads call after hours." },
        { layout: "POINT", title: "Demos hide the delays that live calls expose" },
        ...good.slides.slice(1, 4),
      ],
    });
    const fixed = repairPlan(messy, sources);
    expect(checkPlan(fixed, sources)).toEqual([]);
    expect(fixed.slides.at(-1)?.layout).toBe("CLOSE");
    expect(fixed.slides.map((x) => x.layout)).not.toContain("NUMBER");
    expect(fixed.slides.find((x) => x.layout === "POINT" && x.title.includes("real"))).toMatchObject({ title: "Call it from a real phone" });
    expect(fixed.caption).toContain("Demos, run");
    // STEPs and POINTs mixed would number twice ("Step 1 of 3", "01"): one kind.
    const mixed = plan({ slides: [good.slides[0], { layout: "STEP", title: "Call it from a real phone" }, { layout: "POINT", title: "Time the first reply" }, { layout: "STEP", title: "Book a real showing" }, good.slides[4]] });
    expect(repairPlan(mixed, sources).slides.map((x) => x.layout)).toEqual(["STAKES", "STEP", "STEP", "STEP", "CLOSE"]);
    // A plan with too few slides keeps them all and goes back to the model.
    expect(repairPlan(plan({ slides: good.slides.slice(0, 2) }), sources).slides).toHaveLength(2);
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

  it("keeps the names the post's title turns on", () => {
    expect(namesIn("Why we replaced our AI-writing classifier with Jev")).toEqual(["Jev"]);
    expect(namesIn("Test voice AI on live calls")).toEqual([]);
    const named = { ...sources, names: ["Jev"] };
    expect(checkPlan(plan({ cover: { ...good.cover, headline: "Why we moved our live call checks to Jev" } }), named).join()).toMatch(/no slide names it/);
    const withJev = [good.slides[0], { layout: "POINT", title: "Jev judges the tone, not the code" }, ...good.slides.slice(2)];
    expect(checkPlan(plan({ slides: withJev }), named).join()).not.toMatch(/names it/);
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

  it("offers every slide style, and the GRID and PUNCH pages with their limits", () => {
    const system = renderCarousel(input).messages[0].content;
    for (const style of SLIDE_STYLES) expect(system).toContain(`- ${style}: `);
    expect(system).toContain(`"style": "${SLIDE_STYLES.join(" | ")}"`);
    expect(system).toContain(`- GRID: "title" (max ${WORD_CAPS.GRID.title} words)`);
    expect(system).toContain(`3-6 tiles, each a "label" (max ${WORD_CAPS.GRID.item} words)`);
    expect(system).toContain(`- PUNCH: "lines": 3-4 lines, each max ${WORD_CAPS.PUNCH.line} words`);
  });

  it("fixes the design when the reviewer chose one", () => {
    const system = renderCarousel({ ...input, style: "BENTO" }).messages[0].content;
    expect(system).toContain("The design is fixed: BENTO");
    expect(system).not.toContain("- SWISS: ");
    expect(system).toContain(`"style": "BENTO"`);
  });

  it("sends the gate failures back on the retry", () => {
    const retry = renderCarousel({ ...input, feedback: ["Slide 3 (POINT): title has 15 words; the most is 12."] });
    expect(retry.messages[1].content).toContain("Your previous plan failed these checks");
    expect(retry.messages[1].content).toContain("title has 15 words");
  });
});
