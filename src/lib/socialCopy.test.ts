import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { instagramIssues, linkComment } from "./socialCopy";

describe("the Facebook link comment", () => {
  it("is one plain line: no emoji, no stock 'field guide' copy", () => {
    const line = linkComment("https://example.com/blog/x");
    expect(line).toBe("Read the full article: https://example.com/blog/x");
    expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("is what n8n 03 comments on the Facebook post", () => {
    const wf = fs.readFileSync("n8n/workflows/03_review_publisher/workflow.json", "utf8");
    expect(wf).not.toContain("field guide");
    expect(wf).toContain(linkComment("{{ $('Blog_Result').item.json.blog_url }}"));
  });
});

describe("Instagram caption checks", () => {
  const good = "Missed calls cost small brokerages booked tours.\n\nHere is what a 24/7 line changes.\n\n#RealEstate #VoiceAI #Brokerage";

  it("pass a short, linkless caption with 3 to 5 hashtags", () => {
    expect(instagramIssues(good)).toEqual([]);
  });

  it("flag an empty caption", () => {
    expect(instagramIssues("  ")).toEqual(["Instagram caption is empty."]);
  });

  it("flag a link, since Instagram captions do not click", () => {
    expect(instagramIssues(good.replace("changes.", "changes: https://x.co/a"))).toContain("Instagram caption has a link; links in captions do not click.");
    expect(instagramIssues(good.replace("changes.", "changes, see example.com"))).toContain("Instagram caption has a link; links in captions do not click.");
  });

  it("flag too few or too many hashtags", () => {
    expect(instagramIssues("Short hook.\n\n#One #Two")).toContain("Instagram caption has 2 hashtags; use 3 to 5.");
    expect(instagramIssues("Short hook.\n\n#a1 #b2 #c3 #d4 #e5 #f6")).toContain("Instagram caption has 6 hashtags; use 3 to 5.");
  });

  it("flag a first line longer than the 125 characters shown before 'more'", () => {
    expect(instagramIssues(`${"word ".repeat(30)}\n\n#One #Two #Three`)).toContain("Instagram caption's first line runs past the 125 characters shown before \"more\".");
  });

  it("flag a caption over 60 words, not counting the hashtag line", () => {
    const body = (n: number) => `Hook line.\n\n${"word ".repeat(n - 2).trim()}\n\n#One #Two #Three`;
    expect(instagramIssues(body(60))).toEqual([]);
    expect(instagramIssues(body(61)).join(" ")).toContain("Instagram caption is 61 words; keep it under 60.");
  });

  it("match the copy of these checks in n8n 02's Validate Social Variants", () => {
    const code = fs.readFileSync("n8n/workflows/02_idea_to_asset/code/validate-social-variants.js", "utf8");
    expect(code).toContain("function instagramIssues(");
    expect(code).toContain("keep it under 60.");
    expect(code).toContain(instagramIssues.toString().match(/const URL_PATTERN = .*/)?.[0] ?? "missing");
  });
});
