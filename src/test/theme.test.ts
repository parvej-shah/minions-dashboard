import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The calm redesign (tasks/20-27): a light theme with readable text, and no
 * dark one-off colours creeping back in through raw hex classes.
 */

const root = path.resolve(__dirname, "../..");
const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const themeBlock = css.slice(css.indexOf("@theme"), css.indexOf("}", css.indexOf("@theme")));

function token(name: string): string {
  const m = themeBlock.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${name} missing`);
  return m[1];
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("light theme tokens", () => {
  it("has light grounds", () => {
    for (const t of ["canvas", "surface", "surface-2"]) expect(luminance(token(t))).toBeGreaterThan(0.85);
  });

  it("keeps every text colour readable on every ground (4.5:1)", () => {
    for (const text of ["ink", "muted", "subtle"]) {
      for (const ground of ["canvas", "surface", "surface-2"]) {
        expect(contrast(token(text), token(ground)), `${text} on ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("uses one readable blue for action", () => {
    expect(token("brand").toLowerCase()).toBe("#0066cc");
    expect(contrast(token("brand"), token("surface"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("brand-ink"), token("brand"))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps status colours readable as text", () => {
    for (const s of ["coral", "gold", "danger", "success"]) {
      expect(contrast(token(s), token("surface")), s).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// Third-party marks keep their own colours.
const BRAND_MARKS = new Set(["#0a66c2", "#0077b5", "#1877f2", "#000000", "#ffffff"]);

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return name === "api" ? [] : tsxFiles(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}

/** Raw hex utility classes dark enough to read as a dark-theme island. */
function darkHexes(files: string[]): string[] {
  return files.flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/(?:bg|border|from|to|via|ring|divide)(?:-[trblxy])?-\[(#[0-9a-fA-F]{3,8})\]/g)]
      .map((m) => m[1].toLowerCase())
      .filter((hex) => !BRAND_MARKS.has(hex) && luminance(hex) < 0.08)
      .map((hex) => `${path.relative(root, f)} ${hex}`)
      .concat(
        // Hexes inside arbitrary gradients: bg-[linear-gradient(90deg,#131B24_0%,...)]
        [...readFileSync(f, "utf8").matchAll(/bg-\[(?:linear|radial)-gradient\(([^\]]*)\)\]/g)]
          .flatMap((m) => [...m[1].matchAll(/#[0-9a-fA-F]{6}/g)].map((h) => h[0].toLowerCase()))
          .filter((hex) => luminance(hex) < 0.08)
          .map((hex) => `${path.relative(root, f)} gradient ${hex}`)
      )
  );
}

describe("no dark islands", () => {
  it("has none in the shell and the UI kit", () => {
    const files = [...tsxFiles(path.join(root, "src/components/layout")), ...tsxFiles(path.join(root, "src/components/ui"))];
    expect(darkHexes(files)).toEqual([]);
  });

  it("has none anywhere in the app's screens", () => {
    const files = [...tsxFiles(path.join(root, "src/app")), ...tsxFiles(path.join(root, "src/components"))];
    expect(darkHexes(files)).toEqual([]);
  });
});
