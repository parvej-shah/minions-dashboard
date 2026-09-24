import { describe, expect, it } from "vitest";
import { nextLocalMidnight, pulseState, weekStart } from "./week";
import { checkCandidates, parseItems, unsupported } from "./extract";
import { toMemoryContext } from "@/services/authorContext";
import { vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const DHAKA = "Asia/Dhaka";
// Friday 2026-09-25 10:00 in Dhaka (UTC+6).
const FRI = new Date("2026-09-25T04:00:00Z");
const on = { enabled: true, day: 5 };

describe("the week, in the tenant's timezone", () => {
  it("starts on Monday there, not in UTC", () => {
    expect(weekStart(FRI, DHAKA)).toBe("2026-09-21");
    // Sunday 23:30 in New York is already Monday in Dhaka.
    const sunNightNY = new Date("2026-09-28T03:30:00Z");
    expect(weekStart(sunNightNY, "America/New_York")).toBe("2026-09-21");
    expect(weekStart(sunNightNY, DHAKA)).toBe("2026-09-28");
  });

  it("snoozes until the next local midnight", () => {
    expect(nextLocalMidnight(FRI, DHAKA).toISOString()).toBe("2026-09-25T18:00:00.000Z");
  });
});

describe("pulseState", () => {
  it("opens on the pulse day and stays open to Sunday", () => {
    expect(pulseState(new Date("2026-09-24T04:00:00Z"), DHAKA, on, null)).toEqual({ kind: "NOT_YET", opensOn: "Friday" });
    expect(pulseState(FRI, DHAKA, on, null)).toEqual({ kind: "DUE" });
    expect(pulseState(new Date("2026-09-27T12:00:00Z"), DHAKA, on, null)).toEqual({ kind: "DUE" });
  });

  it("does not carry a missed week over: Monday starts a new, not-yet-open week", () => {
    expect(pulseState(new Date("2026-09-28T04:00:00Z"), DHAKA, on, null).kind).toBe("NOT_YET");
  });

  it("honours snooze, skip, answers, the confirm step and the switch", () => {
    const later = new Date(FRI.getTime() + 3600_000);
    expect(pulseState(FRI, DHAKA, on, { status: "SNOOZED", snoozedUntil: later }).kind).toBe("SNOOZED");
    expect(pulseState(new Date(later.getTime() + 1), DHAKA, on, { status: "SNOOZED", snoozedUntil: later }).kind).toBe("DUE");
    expect(pulseState(FRI, DHAKA, on, { status: "SKIPPED", snoozedUntil: null })).toEqual({ kind: "DONE", status: "SKIPPED" });
    expect(pulseState(FRI, DHAKA, on, { status: "ANSWERED", snoozedUntil: null })).toEqual({ kind: "DONE", status: "ANSWERED" });
    expect(pulseState(FRI, DHAKA, on, { status: "EXTRACTED", snoozedUntil: null }).kind).toBe("CONFIRM");
    expect(pulseState(FRI, DHAKA, { enabled: false, day: 5 }, null).kind).toBe("OFF");
  });
});

const ANSWER =
  "Shipped the call-summary validator for our real estate pilot. I'd assumed agents wanted transcripts; they only open the 3-line summary. Changed my mind about building a transcript viewer.";

describe("items proposed from an answer are checked against it", () => {
  it("finds figures, links and names the answer does not contain", () => {
    expect(unsupported("Agents only open the 3-line summary.", ANSWER)).toEqual([]);
    expect(unsupported("Agents only open the 5-line summary, per HubSpot.", ANSWER)).toEqual(["5", "HubSpot"]);
    expect(unsupported("I'm now sure transcripts go unread. See https://x.io", ANSWER)).toEqual(["https://x.io"]);
    expect(unsupported("This week I've learned agents only open the summary.", ANSWER)).toEqual([]);
    // A capital at the start of a sentence is not a name.
    expect(unsupported("Changed my mind. Transcripts are not the product.", ANSWER)).toEqual([]);
  });

  it("keeps faithful items, drops invented ones, caps at three", () => {
    const raw = [
      { kind: "LESSON", content: "Agents only open the 3-line summary, not the transcript.", disclosure: "PUBLIC" },
      { kind: "OPINION", content: "Brokers at Keller Williams want transcripts less than summaries.", disclosure: "PUBLIC" },
      { kind: "NOPE", content: "Something else entirely happened this week." },
    ];
    const r = checkCandidates(raw, ANSWER, {});
    expect(r.candidates).toEqual([{ kind: "LESSON", content: "Agents only open the 3-line summary, not the transcript.", disclosure: "PUBLIC" }]);
    expect(r.dropped.map((d) => d.reason)).toEqual([expect.stringMatching(/Keller/), expect.stringMatching(/unknown kind/)]);
    expect(r.fallback).toBe(false);
  });

  it("\"can it be named: no\" makes every item GENERALIZE", () => {
    const r = checkCandidates([{ kind: "LESSON", content: "Agents only open the 3-line summary, not the transcript.", disclosure: "PUBLIC" }], ANSWER, { named: "NO" });
    expect(r.candidates[0].disclosure).toBe("GENERALIZE");
  });

  it("offers the answer itself when the model gave nothing usable", () => {
    const r = checkCandidates(parseItems("not json"), ANSWER, {});
    expect(r).toMatchObject({ fallback: true, candidates: [{ kind: "CURRENT_WORK", content: ANSWER, disclosure: "PUBLIC" }] });
    expect(parseItems('```json\n{"items":[{"kind":"LESSON"}]}\n```')).toEqual([{ kind: "LESSON" }]);
  });

  it("offers nothing, not the vague answer, when the model found nothing specific", () => {
    expect(checkCandidates(parseItems('{"items":[]}'), "Busy week, mostly meetings and some bug fixing.", {})).toEqual({ candidates: [], dropped: [], fallback: false });
  });
});

describe("weekly items count as new for two weeks", () => {
  const row = { id: "m", kind: "LESSON", content: "x", disclosure: "PUBLIC", usedCount: 0 };
  const now = new Date("2026-09-25T00:00:00Z").getTime();
  it("marks only recent WEEKLY_PULSE items fresh", () => {
    expect(toMemoryContext({ ...row, source: "WEEKLY_PULSE", createdAt: new Date("2026-09-20T00:00:00Z") }, now).fresh).toBe(true);
    expect(toMemoryContext({ ...row, source: "WEEKLY_PULSE", createdAt: new Date("2026-09-01T00:00:00Z") }, now).fresh).toBeUndefined();
    expect(toMemoryContext({ ...row, source: "BRAND_PAGE", createdAt: new Date("2026-09-24T00:00:00Z") }, now).fresh).toBeUndefined();
  });
});
