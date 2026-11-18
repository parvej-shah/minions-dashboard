import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf-8");

describe("Task 86: premium login page", () => {
  const screen = read("src/app/(auth)/login/_components/LoginScreen.tsx");
  const art = read("src/app/(auth)/login/_components/WelcomeArt.tsx");
  const css = read("src/app/globals.css");

  it("uses a split layout on md+ with the art panel and the sign-in column", () => {
    expect(screen).toMatch(/md:grid-cols-/);
    expect(screen).toContain("<WelcomeArt");
  });

  it("draws the art as one labelled image", () => {
    expect(art.match(/role="img"/g)?.length).toBe(1);
    expect(art).toContain("aria-label=");
  });

  it("puts the Google mark on the sign-in button and keeps the loading text", () => {
    expect(screen).toContain("GoogleMark");
    expect(screen).toContain("Opening Google…");
    expect(screen).toContain("Continue with Google");
  });

  it("keeps the minimal copy and the error alert", () => {
    expect(screen).toContain("LinkedIn just doesn&apos;t know it yet.");
    expect(screen).toContain("Nothing goes out until you say yes.");
    expect(screen).toContain("Free for 14 days.");
    expect(screen).toContain('role="alert"');
  });

  it("turns the float animation off for reduced-motion users", () => {
    expect(css).toContain("@keyframes login-float");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced.slice(0, 400)).toContain("login-float");
  });
});
