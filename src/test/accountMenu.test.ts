import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Account Menu cleanup (Task 83)", () => {
  const accountMenuSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/layout/AccountMenu.tsx"),
    "utf-8"
  );
  const dashboardShellSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/layout/DashboardShell.tsx"),
    "utf-8"
  );

  it("does not render 'Find new ideas now' or 'Finding new ideas…' in AccountMenu", () => {
    expect(accountMenuSrc).not.toContain("Find new ideas now");
    expect(accountMenuSrc).not.toContain("Finding new ideas…");
    expect(accountMenuSrc).not.toContain("onHarvest");
    expect(accountMenuSrc).not.toContain("isHarvesting");
  });

  it("does not pass harvest triggers from DashboardShell to AccountMenu", () => {
    expect(dashboardShellSrc).not.toMatch(/<AccountMenu[^>]*onHarvest/);
    expect(dashboardShellSrc).not.toMatch(/<AccountMenu[^>]*isHarvesting/);
  });
});
