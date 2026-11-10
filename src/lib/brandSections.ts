/**
 * How the Brand page is laid out. Basics are the four things a post cannot be
 * written without, and they are what setup asks. Everything else has a working
 * default and only makes posts sound more like the author, so it sits under
 * Advanced, one row each (tasks/30.md has what the engine reads from each).
 */
export const BRAND_SECTIONS = ["basics", "experience", "reader", "voice", "proof", "avoid", "sources", "cover"] as const;
export type BrandSection = (typeof BRAND_SECTIONS)[number];

export interface AdvancedSection {
  id: Exclude<BrandSection, "basics">;
  title: string;
  /** What it adds, in one line. */
  line: string;
}

export const ADVANCED_SECTIONS: AdvancedSection[] = [
  { id: "voice", title: "Writing voice", line: "Samples, tone and phrases, so drafts read like you wrote them." },
  { id: "reader", title: "Reader details", line: "Their role, problems and the words they use." },
  { id: "experience", title: "All your experience", line: "Everything you have added, and your weekly updates." },
  { id: "proof", title: "Facts and what sets you apart", line: "Things posts may state as fact, each with a source." },
  { id: "avoid", title: "Words to avoid", line: "Words and phrases you never want in a post." },
  { id: "sources", title: "Idea sources", line: "The feeds Minions reads for things worth posting about." },
  { id: "cover", title: "Cover look", line: "Your photo, colours and illustration style." },
];

/** Tab names from before the regroup, still used by links elsewhere. */
const OLD_TABS: Record<string, BrandSection> = { overview: "basics", "voice-proof": "voice", lexicon: "avoid" };

/** The section a `?tab=` value opens. Anything unknown opens the basics. */
export function resolveBrandSection(tab: string | null | undefined): BrandSection {
  if (!tab) return "basics";
  if ((BRAND_SECTIONS as readonly string[]).includes(tab)) return tab as BrandSection;
  return OLD_TABS[tab] ?? "basics";
}
