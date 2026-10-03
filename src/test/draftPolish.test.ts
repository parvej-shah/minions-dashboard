import { beforeEach, describe, expect, it, vi } from "vitest";

const m = { askJev: vi.fn(), chat: vi.fn() };
vi.mock("@/lib/ai/jev", () => ({ askJev: m.askJev }));
vi.mock("@/lib/ai/modelChain", () => ({ chatWithFallback: m.chat }));

const { polishText, MAX_REWRITES } = await import("@/services/draftPolish");

const TEMPLATE = "A voicemail doesn't signal unavailability, it signals failure.\n\nSpeed isn't a courtesy. It's the signal.\n\nNo promise. No follow-up. No trace.\n\nThe backend is the truth.";
const BETTER = "I think a voicemail after hours tells a buyer nobody is coming back tonight, and most of them move on to the next listing before morning.\n\nWhat I'd check first is how fast the call gets answered, because that is the part buyers notice.\n\nHas anyone measured how many of those callers try again?";
const reply = (text: string) => ({ status: 200, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify({ text }) } }] }) });
const jev = (human: number, yes = 0) => ({ human: { type: "score", score: human }, contrast: { type: "noul", noul: yes }, fragments: { type: "noul", noul: yes }, maxim_close: { type: "noul", noul: yes }, lecture: { type: "noul", noul: 0 }, generic: { type: "noul", noul: 0 } });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DASHSCOPE_API_KEY = "test";
});

describe("polishText", () => {
  it("rewrites once when Jev says it reads as a template, and keeps the better version", async () => {
    m.askJev.mockResolvedValueOnce(jev(0.6, 0.9)).mockResolvedValueOnce(jev(3.2));
    const rewrite = "I think a voicemail after hours tells a buyer nobody is coming back tonight.\n\nWhat I'd check first is how fast the call gets answered, since that is what buyers notice.";
    m.chat.mockResolvedValue(reply(rewrite));
    const r = await polishText(TEMPLATE, "post");
    expect(m.chat).toHaveBeenCalledTimes(1);
    expect(r.rewrites).toBe(MAX_REWRITES);
    expect(MAX_REWRITES).toBe(1);
    expect(r.before.needsRewrite).toBe(true);
    expect(r.text).toBe(rewrite);
    expect(r.after.human).toBe(3.2);
  });

  it("leaves a text Jev and the code both pass", async () => {
    m.askJev.mockResolvedValue(jev(3.5));
    const r = await polishText(BETTER, "post");
    expect(m.chat).not.toHaveBeenCalled();
    expect(r.text).toBe(BETTER);
  });

  it("decides with the code alone when Jev is unavailable", async () => {
    m.askJev.mockResolvedValue(null);
    m.chat.mockResolvedValue(reply(TEMPLATE.replace("The backend is the truth.", "The backend is the truth, as far as I can tell.")));
    const r = await polishText(TEMPLATE, "post");
    expect(r.before.human).toBeNull();
    expect(r.before.needsRewrite).toBe(true);
    expect(m.chat).toHaveBeenCalledTimes(1);
  });

  it("keeps the original when the rewrite adds a figure", async () => {
    m.askJev.mockResolvedValueOnce(jev(0.5, 0.9)).mockResolvedValue(jev(3.8));
    m.chat.mockResolvedValue(reply(TEMPLATE.replace("No promise.", "Most of 40 callers never return.")));
    const r = await polishText(TEMPLATE, "post");
    expect(r.text).toBe(TEMPLATE);
    expect(r.rejected).toMatch(/figure/);
  });
});
