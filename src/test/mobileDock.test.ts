import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf-8");

describe("Task 85: floating mobile dock", () => {
  const nav = read("src/components/layout/TopNav.tsx");
  const bottomTabs = nav.slice(nav.indexOf("export function BottomTabs"));

  it("floats as an inset, rounded dock instead of a full-bleed bar", () => {
    expect(bottomTabs).toContain('data-dock="mobile"');
    expect(bottomTabs).toMatch(/rounded-\[2\dpx\]/);
    expect(bottomTabs).not.toContain("border-t");
  });

  it("marks the active tab with one sliding indicator driven by the active index", () => {
    expect(bottomTabs).toContain("activeIndex");
    expect(bottomTabs).toMatch(/translateX\(\$\{activeIndex \* 100\}%\)/);
    expect(bottomTabs).toContain("activeIndex < 0");
  });

  it("keeps the three tabs equal (no raised Posts tile)", () => {
    expect(bottomTabs).not.toContain("isPosts");
    expect(bottomTabs).not.toMatch(/-translate-y-/);
  });

  it("keeps tabs thumb-sized with a visible focus ring", () => {
    expect(bottomTabs).toContain("min-h-[52px]");
    expect(bottomTabs).toContain("focus-visible:ring");
  });

  it("turns indicator motion off for reduced-motion users", () => {
    expect(bottomTabs).toContain("motion-reduce:transition-none");
  });

  it("lifts the mobile action bar and toasts above the dock", () => {
    expect(read("src/components/editorial/MobileActionBar.tsx")).not.toContain("67px");
    expect(read("src/components/ui/Toast.tsx")).toContain("bottom-[calc(5.75rem+env(safe-area-inset-bottom))]");
  });
});
