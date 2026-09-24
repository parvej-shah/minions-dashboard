import { describe, expect, it, vi } from "vitest";
import { acceptRewrite, applyRewrites, bannedPhrases, offendingSentences, sentences } from "./banned";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const BANNED = ["Deterministic", "seamless", "unlock the power of"];

describe("banned words", () => {
  it("takes words and short phrases from FORBIDDEN rows, not whole rules", () => {
    expect(
      bannedPhrases(["Deterministic", " seamless ", "unlock the power of", 'FORBIDDEN: Never mention, promise, or discuss: "X".', "seamless"])
    ).toEqual(["Deterministic", "seamless", "unlock the power of"]);
  });

  it("finds only the sentences that use one, as whole words in any case", () => {
    const body = "One agent talks. A second validates against a deterministic schema.\n\n## Why it matters\nDeterminism is not the word. It is seamless.";
    expect(offendingSentences([body], BANNED)).toEqual([
      "A second validates against a deterministic schema.",
      "It is seamless.",
    ]);
  });

  it("keeps headings and list items as whole lines", () => {
    expect(sentences("## A deterministic path. Really\n- one. two")).toEqual(["## A deterministic path. Really", "- one. two"]);
  });

  it("accepts a rewrite only when the word is gone and nothing was added", () => {
    const s = "Only leads passing deterministic checks reach agents.";
    expect(acceptRewrite(s, "Only leads passing fixed checks reach agents.", BANNED)).toBeNull();
    expect(acceptRewrite(s, "Only leads passing Deterministic checks reach agents.", BANNED)).toMatch(/banned/);
    expect(acceptRewrite(s, "Only leads passing 3 fixed checks reach agents.", BANNED)).toMatch(/figure 3/);
    expect(acceptRewrite(s, "Leads.", BANNED)).toMatch(/length/);
    expect(acceptRewrite(s, "Only leads passing checks — fixed ones — reach agents.", BANNED)).toMatch(/em dash/);
    expect(acceptRewrite("## A deterministic path", "A fixed path", BANNED)).toMatch(/markdown/);
  });

  it("replaces every occurrence of an accepted sentence and nothing else", () => {
    const s = "Only leads passing deterministic checks reach agents.";
    const text = `Intro. ${s}\n\nLater: ${s}`;
    expect(applyRewrites(text, new Map([[s, "Only leads passing fixed checks reach agents."]]))).toBe(
      "Intro. Only leads passing fixed checks reach agents.\n\nLater: Only leads passing fixed checks reach agents."
    );
  });
});

describe("scrubBannedWords", () => {
  it("rewrites nothing, and calls no model, when no banned word is used", async () => {
    const { scrubBannedWords } = await import("@/services/bannedScrub");
    const r = await scrubBannedWords("c", { body: "Clean text." }, BANNED);
    expect(r).toEqual({ texts: { body: "Clean text." }, rewritten: [], kept: [], remaining: [] });
  });

  it("leaves the text and reports the word when the model cannot be reached", async () => {
    const key = process.env.DASHSCOPE_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    try {
      const { scrubBannedWords } = await import("@/services/bannedScrub");
      const r = await scrubBannedWords("c", { body: "It is seamless." }, BANNED);
      expect(r.texts.body).toBe("It is seamless.");
      expect(r.remaining).toEqual(["seamless"]);
      expect(r.kept[0].reason).toMatch(/no rewrite/);
    } finally {
      if (key !== undefined) process.env.DASHSCOPE_API_KEY = key;
    }
  });
});
