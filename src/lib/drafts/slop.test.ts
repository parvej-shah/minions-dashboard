import { describe, expect, it } from "vitest";
import { slopReport, SLOP_REWRITE_AT } from "./slop";
import { rejectPolish } from "./polish";

// The shape of a Minions post that drew half the profile's usual reach (Sep 2026).
const TEMPLATE = `Routing an after-hours call to voicemail does not pause the sale. It permanently signals that you cannot keep up.

A buyer calling at 8 p.m. has a shortlist. A voicemail doesn't signal unavailability, it signals operational failure.

Speed-to-lead isn't a courtesy. It's the primary signal of reliability.

No verbal promise. No manual follow-up. No trace.

The booking only counts when both systems confirm it.

The backend is the truth.`;

const PERSON = `I've been looking at how brokerages handle calls after 8 p.m., and the part I keep coming back to is what the caller hears in the first few seconds.

If it's a generic voicemail, most buyers I talk to assume nobody will call back tonight, so they try the next listing on their phone while they're still in the mood to look at houses.

I don't think the fix is complicated. Answer the call, ask two questions, and book the showing straight into the calendar the agent already uses.

What I'm still unsure about is how much of the qualifying should happen on that first call. Has anyone found a line that works?`;

describe("slopReport", () => {
  it("finds the template figures with the sentences to fix", () => {
    const r = slopReport(TEMPLATE);
    const kinds = r.problems.map((p) => p.kind);
    expect(kinds).toEqual(expect.arrayContaining(["contrast", "fragments", "anaphora", "maxim_close"]));
    expect(r.problems.find((p) => p.kind === "contrast")!.examples.join(" ")).toMatch(/signals operational failure/);
    expect(r.score).toBeGreaterThanOrEqual(SLOP_REWRITE_AT);
  });

  it("lets plain first-person writing through", () => {
    const r = slopReport(PERSON);
    expect(r.score).toBeLessThan(SLOP_REWRITE_AT);
  });

  it("allows one contrast, and ignores headings, hashtags and figures", () => {
    const one = `Most teams think the voice is the hard part. It isn't, in my experience it's the calendar write.

That is where I would look first, because a slot can vanish between the question and the booking, and nobody notices until the buyer turns up at a house with no agent waiting outside.

I have seen teams spend a month tuning how the agent sounds on the phone while the booking step quietly fails a few times a week. The caller hears a confident confirmation, the calendar never gets the event, and the agent finds out from an annoyed text on Saturday morning.

So before any voice work, I would run twenty test bookings end to end and check each one landed where the agent actually looks.

$300
AED 1,100

#VoiceAI #RealEstate`;
    expect(slopReport(one).problems.map((p) => p.kind)).not.toContain("contrast");
    expect(slopReport(one).problems.map((p) => p.kind)).not.toContain("fragments");
  });

  it("allows no contrast in a hook or other short text", () => {
    const hook = "AI listing posts get half the impressions of hand-written ones. The problem is not the content, it is that the reader hears the machinery.";
    expect(slopReport(hook).problems.map((p) => p.kind)).toContain("contrast");
    // Across two sentences, with the second a plain statement.
    expect(slopReport("Listing posts by AI draw half the reach. The problem is not the content. The reader hears the machinery.").problems.map((p) => p.kind)).toContain("contrast");
    expect(slopReport("Reach dropped by half. Not because of the words. Because the reader hears the machinery.").problems.map((p) => p.kind)).toContain("contrast");
  });

  it("flags stock vocabulary and symbols", () => {
    const r = slopReport("This is a crucial shift in the landscape. Call → qualify → book.");
    expect(r.problems.map((p) => p.kind)).toEqual(expect.arrayContaining(["vocabulary", "symbols"]));
  });
});

describe("rejectPolish", () => {
  const base = "## Why\nI think 2,500 minutes a month is the number to start from.\n\nThat is what I'd check first.\n\n#VoiceAI";
  it("keeps a rewrite that only changes wording", () => {
    expect(rejectPolish(base, "## Why\nI'd start from 2,500 minutes a month, I think.\n\nThat is the first thing I'd check.\n\n#VoiceAI")).toBeNull();
  });
  it("refuses new or missing figures, hashtags, headings and invented experience", () => {
    expect(rejectPolish(base, base.replace("2,500", "3,000"))).toMatch(/figure/);
    expect(rejectPolish(base, base.replace("#VoiceAI", ""))).toMatch(/hashtags/);
    expect(rejectPolish(base, base.replace("## Why", "## How"))).toMatch(/headings/);
    // A heading whose em dash became a comma is the same heading.
    const dashed = base.replace("## Why", "## Why—and how");
    expect(rejectPolish(dashed, dashed.replace("—", ", "))).toBeNull();
    expect(rejectPolish(base, base.replace("I think", "When we built this, I think"))).toMatch(/experience|'we'/);
    expect(rejectPolish(base, "Short.")).toMatch(/length|figure/);
  });
});
