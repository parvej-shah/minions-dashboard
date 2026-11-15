import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Task 81: Recently Posted Cards in TodayView", () => {
  const todayViewPath = path.resolve(__dirname, "../components/today/TodayView.tsx");
  const src = fs.readFileSync(todayViewPath, "utf-8");

  it("removes the plain text list from Recently posted section", () => {
    // Should not have the old <ul> / <li className="border-b border-line"> under Recently posted
    expect(src).not.toMatch(/<section aria-labelledby="recent"[^>]*>[\s\S]*?<ul>[\s\S]*?<li className="border-b border-line">/);
  });

  it("renders a responsive card grid for recently posted items", () => {
    // Should render a grid container for posted posts
    expect(src).toMatch(/grid grid-cols-1/);
    expect(src).toMatch(/sm:grid-cols-2/);
    expect(src).toMatch(/lg:grid-cols-3|md:grid-cols-3/);
  });

  it("renders visual artwork using PostThumb inside each recently posted card", () => {
    // Each card must render PostThumb
    expect(src).toMatch(/<PostThumb[^>]*post=\{post\}/);
    expect(src).toMatch(/aspect-\[4\/5\]/);
  });

  it("displays channel metadata, publication date, and live link support", () => {
    // Must display channel label and dayText
    expect(src).toMatch(/dayText\(post\.published_at/);
    expect(src).toMatch(/failureSummary\(post\.publish_failures\)/);
    expect(src).toMatch(/liveLinks/);
  });

  it("links the SectionHeader to All posted posts", () => {
    expect(src).toMatch(/SectionHeader id="recent" title="Recently posted" href="\/posts\?show=posted" linkLabel="All posted"/);
  });

  it("provides interactive card navigation to editorial studio", () => {
    expect(src).toMatch(/href=\{`\/editorial\?id=\$\{encodeURIComponent\(post\.id\)\}`\}/);
  });
});
