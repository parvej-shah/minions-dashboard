/**
 * How the Brand page is laid out. Basics are what a post cannot go out
 * without: the four things setup asks, plus the cover look (tasks/31.md).
 * Everything else has a working default and only makes posts sound more like
 * the author, so it sits under Advanced, one row each (tasks/30.md has what the
 * engine reads from each).
 */
export const BRAND_SECTIONS = ["basics", "experience", "reader", "voice", "proof", "avoid", "sources", "cover"] as const;
export type BrandSection = (typeof BRAND_SECTIONS)[number];

export interface SectionPage {
  id: Exclude<BrandSection, "basics">;
  title: string;
  /** What it adds, in one line. */
  line: string;
  /** Listed under Advanced. False: a basic's full editor, opened from its card. */
  advanced: boolean;
}

/** Every page a section opens as. */
export const SECTION_PAGES: SectionPage[] = [
  { id: "voice", title: "Writing voice", line: "Samples, tone and phrases, so drafts read like you wrote them.", advanced: true },
  { id: "reader", title: "Reader details", line: "Their problems, questions and the words they use.", advanced: true },
  { id: "experience", title: "All your experience", line: "Everything you have added, and your weekly updates.", advanced: true },
  { id: "proof", title: "Facts and what sets you apart", line: "Things posts may state as fact, each with a source.", advanced: true },
  { id: "avoid", title: "Words to avoid", line: "Words and phrases you never want in a post.", advanced: true },
  { id: "sources", title: "Idea sources", line: "The feeds Minions reads for things worth posting about.", advanced: true },
  { id: "cover", title: "Cover look", line: "Your photo, colours and illustration style.", advanced: false },
];

export const ADVANCED_SECTIONS = SECTION_PAGES.filter((s) => s.advanced);

/** Tab names from before the regroup, still used by links elsewhere. */
const OLD_TABS: Record<string, BrandSection> = { overview: "basics", "voice-proof": "voice", lexicon: "avoid" };

/** The section a `?tab=` value opens. Anything unknown opens the basics. */
export function resolveBrandSection(tab: string | null | undefined): BrandSection {
  if (!tab) return "basics";
  if ((BRAND_SECTIONS as readonly string[]).includes(tab)) return tab as BrandSection;
  return OLD_TABS[tab] ?? "basics";
}
