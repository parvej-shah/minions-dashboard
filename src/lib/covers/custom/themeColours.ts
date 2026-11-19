import type { TNode } from "./parse";

/**
 * A custom design follows the workspace's colour theme (task 98): every text
 * colour, the cover's background and every background behind text must be
 * built from var(--ink), var(--paper), var(--accent) and var(--secondary).
 * Icons, SVG, lines and shapes that sit behind no text may keep their own
 * colours. Only the check enforces this, so designs saved earlier still load.
 */

const THEME_VAR = /var\(\s*--(?:ink|paper|accent|secondary)\s*\)/gi;
const PICTURE = /url\([^)]*\)/gi;
const GRADIENT_FN = /\b(?:repeating-)?(?:linear|radial)-gradient\s*\(/gi;
const NUMBER = /-?\d*\.?\d+(?:deg|turn|rad|grad|px|%)?/gi;
const KEYWORDS = /\b(?:to|at|top|bottom|left|right|center|circle|ellipse|closest-side|closest-corner|farthest-side|farthest-corner|transparent|none|no-repeat|repeat|repeat-x|repeat-y|cover|contain|auto)\b/gi;

/** True when a colour or background value uses only theme colours (plus pictures and transparent). */
export function isThemed(value: string | number): boolean {
  const rest = String(value)
    .replace(THEME_VAR, " ")
    .replace(PICTURE, " ")
    .replace(GRADIENT_FN, " ")
    .replace(KEYWORDS, " ")
    .replace(NUMBER, " ")
    .replace(/[(),/\s]/g, "");
  return rest === "";
}

const BACKGROUNDS = ["background", "backgroundColor", "backgroundImage"] as const;
const label = (slot: string) => slot.replace(/_/g, " ");
const RULE = "use var(--ink), var(--paper), var(--accent) or var(--secondary)";

const backgroundsOf = (node: TNode) => BACKGROUNDS.map((k) => node.style[k]).filter((v) => v !== undefined);

/** Plain-language problems; empty when the design follows the theme. */
export function themeColourProblems(root: TNode): string[] {
  const out = new Set<string>();

  const rootBgs = backgroundsOf(root);
  if (rootBgs.length === 0) out.add(`The cover has no background; set background-color: var(--paper) on the outer element.`);
  else if (!rootBgs.every(isThemed)) out.add(`The cover's background must use theme colours: ${RULE}.`);

  const walk = (node: TNode, colour: string | number | undefined, fixedBehind: boolean) => {
    const own = node.style.color ?? colour;
    const behind = fixedBehind || (node !== root && !backgroundsOf(node).every(isThemed));
    if (node.fit) {
      const slot = label(node.fit.slot);
      if (own === undefined) out.add(`The ${slot} has no colour; set color: var(--ink) or another theme colour.`);
      else if (!isThemed(own)) out.add(`The ${slot} colour must be a theme colour: ${RULE}.`);
      if (behind) out.add(`The background behind the ${slot} must use theme colours: ${RULE}.`);
    }
    for (const c of node.children) if ("tag" in c && !c.svg) walk(c, own, behind);
  };
  walk(root, undefined, false);
  return [...out];
}
