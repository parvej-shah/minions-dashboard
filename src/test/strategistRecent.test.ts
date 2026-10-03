import { describe, expect, it } from "vitest";
import { renderStrategist } from "@/lib/prompts/strategist";
import { draftAuthor } from "./n8n/fixtures";

const render = (author: typeof draftAuthor) =>
  renderStrategist({ brand_name: "Acme", target: { idea_id: "IDEA-1" }, brand_context: "ctx", author });

describe("the strategist does not repeat the author's recent arguments", () => {
  it("lists them as data and asks for a new point", () => {
    const p = render({ ...draftAuthor, recent_posts: ["A booking only counts when the calendar confirms it."] });
    expect(p.messages[1].content).toMatch(/RECENTLY POSTED[\s\S]*calendar confirms it/);
    expect(p.messages[0].content).toMatch(/Do not argue any of them again/);
  });

  it("says nothing about recent posts when there are none", () => {
    expect(render({ ...draftAuthor, recent_posts: [] }).messages[1].content).not.toMatch(/RECENTLY POSTED/);
  });

  it("makes an idea with no experience behind it the author's take", () => {
    expect(render({ ...draftAuthor, memory: [] }).messages[0].content).toMatch(/the author's take on the source/);
    expect(render(draftAuthor).messages[0].content).not.toMatch(/the author's take on the source/);
  });
});
