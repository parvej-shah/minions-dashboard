/**
 * The angle library the harvester draws from, and the rotation that stops it
 * repeating itself.
 *
 * 01_idea_harvester's prompt used to hardcode three fixed angles -- THE
 * STAKES, THE MYTH, HOW IT ACTUALLY WORKS -- along with a JSON skeleton that
 * repeated those same three pillars. It asked the model to "rotate structures
 * and pillars" while the scaffold around it made rotation impossible, so
 * every run produced the same three shapes. Structural repetition was designed
 * in, and no amount of prompt-level pleading could overcome it.
 *
 * Now the three angles are drawn from this library and rotated per run.
 */
export interface ContentAngle {
  id: string;
  pillar: string;
  /** The instruction injected into the harvest prompt for this slot. */
  brief: string;
}

export const CONTENT_ANGLES: ContentAngle[] = [
  {
    id: "stakes",
    pillar: "The Stakes",
    brief:
      "Make the cost of inaction or a bad decision concrete. Show a specific, recognizable scenario where the wrong choice costs money, downtime, or trust. Ground it in realistic operational consequences, not invented figures.",
  },
  {
    id: "myth",
    pillar: "The Myth",
    brief:
      "Name a widespread belief in this field that is wrong or outdated, and argue against it. Contrarian and debate-worthy, but the argument must stand on reasoning the reader can check.",
  },
  {
    id: "mechanism",
    pillar: "How It Works",
    brief:
      "Explain a real mechanism, workflow, or sequence that solves a genuine operational headache. Deep and specific enough that a practitioner recognizes it as true.",
  },
  {
    id: "tradeoff",
    pillar: "The Trade-off",
    brief:
      "Take two credible options this audience actually chooses between and lay out where each one wins. Refuse the easy 'it depends' -- state which conditions decide it.",
  },
  {
    id: "postmortem",
    pillar: "What Went Wrong",
    brief:
      "Walk through a failure pattern this audience recognizes: what looked reasonable at the time, where it broke, and the earliest signal that would have caught it. No invented case studies -- describe the pattern, not a fabricated client.",
  },
  {
    id: "shift",
    pillar: "What Changed",
    brief:
      "Identify something that recently changed in this field -- a rule, a price, a capability, a norm -- and explain what it makes newly possible or newly foolish. Timely interpretation, not news summary.",
  },
  {
    id: "counterintuitive",
    pillar: "The Uncomfortable Truth",
    brief:
      "Say the thing practitioners privately agree on but rarely publish. It must be defensible and specific, not merely provocative.",
  },
  {
    id: "decision",
    pillar: "Decision Guide",
    brief:
      "Give the reader a way to decide something they are currently stuck on. Name the criteria in the order they actually matter and what disqualifies an option outright.",
  },
  {
    id: "firstprinciples",
    pillar: "First Principles",
    brief:
      "Strip a widely-copied practice back to why it exists, then show which parts are essential and which are cargo cult carried over from a context that no longer applies.",
  },
  {
    id: "benchmark",
    pillar: "What Good Looks Like",
    brief:
      "Describe the standard a competent operation actually hits, concretely enough that a reader can measure themselves against it and find the gap.",
  },
];

export const ANGLES_PER_RUN = 3;

/**
 * Picks the angles for one run, walking the library so consecutive runs never
 * repeat a set. `runIndex` is a monotonically increasing per-tenant counter
 * (the tenant's harvest run count), which makes the rotation deterministic and
 * inspectable rather than random -- two runs in the same minute still differ.
 */
export function selectAnglesForRun(runIndex: number, count = ANGLES_PER_RUN): ContentAngle[] {
  const total = CONTENT_ANGLES.length;
  const start = ((runIndex % total) + total) % total;
  const picked: ContentAngle[] = [];
  // Stride by a number coprime with the library size so successive runs draw
  // different *combinations*, not just a window sliding by one.
  const stride = 3;
  for (let i = 0; i < Math.min(count, total); i++) {
    picked.push(CONTENT_ANGLES[(start + i * stride) % total]);
  }
  return picked;
}
