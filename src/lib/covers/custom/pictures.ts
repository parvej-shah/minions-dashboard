import type { TNode } from "./parse";

/**
 * The headshot and the cut-out in a custom design (task 99). The real
 * pictures come in many shapes, so a box that does not say how to fit them
 * stretches the person. Only the check enforces this, so designs saved
 * earlier still load.
 */

const FIT: Record<"photo" | "cutout", { allowed: string[]; message: string }> = {
  cutout: { allowed: ["contain"], message: "The cut-out needs object-fit:contain (and object-position:bottom) on its <img>, so the person is never stretched or cropped." },
  photo: { allowed: ["cover", "contain"], message: "The headshot needs object-fit:cover on its <img>, so the face is never stretched." },
};

/** Plain-language problems; empty when every picture slot says how it fits. */
export function pictureProblems(root: TNode): string[] {
  const out = new Set<string>();
  const walk = (node: TNode) => {
    const slot = node.imageSlot;
    if (slot === "photo" || slot === "cutout") {
      const fit = String(node.style.objectFit ?? "").trim().toLowerCase();
      if (!FIT[slot].allowed.includes(fit)) out.add(FIT[slot].message);
    }
    for (const c of node.children) if ("tag" in c) walk(c);
  };
  walk(root);
  return [...out];
}

/** The picture slots a design uses. */
export function pictureSlots(slots: readonly string[]): ("photo" | "cutout")[] {
  return (["photo", "cutout"] as const).filter((s) => slots.includes(s));
}

const svg = (body: string) => `data:image/svg+xml;base64,${Buffer.from(body).toString("base64")}`;
const FIGURE = "#A7ADB4";

/**
 * Neutral figures drawn in the preview when the workspace has no photo or
 * cut-out yet, in the real shapes: a portrait cut-out on a transparent
 * background (taller than wide, like a trimmed cut-out) and a square headshot.
 */
export const STAND_IN = {
  cutout: svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">` +
      `<circle cx="300" cy="210" r="150" fill="${FIGURE}"/>` +
      `<path d="M20 800 C20 560 140 420 300 420 C460 420 580 560 580 800 Z" fill="${FIGURE}"/></svg>`,
  ),
  photo: svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
      `<rect width="400" height="400" fill="#D5D9DE"/>` +
      `<circle cx="200" cy="160" r="80" fill="${FIGURE}"/>` +
      `<path d="M50 400 C50 290 120 250 200 250 C280 250 350 290 350 400 Z" fill="${FIGURE}"/></svg>`,
  ),
} as const;
