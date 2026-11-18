import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Task 84: Mobile Bottom Bar & PWA Install Reliability", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const topNavPath = path.resolve(process.cwd(), "src/components/layout/TopNav.tsx");
  const installPromptPath = path.resolve(process.cwd(), "src/components/pwa/InstallPrompt.tsx");

  it("ensures public/sw.js precaches valid /manifest.json and avoids 404 /manifest.webmanifest", () => {
    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).not.toContain('"/manifest.webmanifest"');
    expect(swContent).toContain('"/manifest.json"');
  });

  it("ensures BottomTabs in TopNav.tsx eliminates the broken grid-cols-4 layout", () => {
    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    // grid-cols-4 leaves an empty 4th column when navItems only has 3 items
    expect(topNavContent).not.toContain("grid-cols-4");
  });

  // The raised Posts tile from task 84 was replaced by the equal-tab floating dock (task 85, mobileDock.test.ts).

  it("ensures InstallPrompt has a swift, mobile-friendly reveal delay instead of 25s+", () => {
    const installPromptContent = fs.readFileSync(installPromptPath, "utf-8");
    // 25_000 and 30_000 ms delays prevented users from ever seeing the prompt on mobile
    expect(installPromptContent).not.toContain("25_000");
    expect(installPromptContent).not.toContain("30_000");
  });

  it("ensures AccountMenu provides a direct Install app action for user-triggered installation", () => {
    const accountMenuPath = path.resolve(process.cwd(), "src/components/layout/AccountMenu.tsx");
    const accountMenuContent = fs.readFileSync(accountMenuPath, "utf-8");
    expect(accountMenuContent).toContain("Install app");
    expect(accountMenuContent).toContain("minions:open-install-prompt");
  });
});
