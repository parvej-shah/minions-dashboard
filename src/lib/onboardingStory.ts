import type { StoryKind } from "@/lib/onboardingDraft";

/**
 * Setup's last question picks one thing to post about. A pick keeps its own
 * kind (current work or past experience); anything typed counts as a lesson,
 * so the user never has to classify their own story.
 */

export interface StoryPick {
  id: string;
  kind: StoryKind;
  content: string;
}

const SEPARATOR = "\n\n";

export function composeStory(pick: StoryPick | null, text: string): { storyText: string; storyKind: StoryKind } {
  const detail = text.trim();
  if (!pick) return { storyText: detail, storyKind: "LESSON" };
  return { storyText: detail ? `${pick.content}${SEPARATOR}${detail}` : pick.content, storyKind: pick.kind };
}

/** Which pick a saved story came from, and what was added under it. */
export function restoreStory(storyText: string, picks: StoryPick[]): { pickId: string | null; detail: string } {
  const text = storyText.trim();
  if (!text) return { pickId: picks[0]?.id ?? null, detail: "" };
  for (const pick of picks) {
    if (text === pick.content) return { pickId: pick.id, detail: "" };
    if (text.startsWith(pick.content + SEPARATOR)) return { pickId: pick.id, detail: text.slice(pick.content.length + SEPARATOR.length).trim() };
  }
  return { pickId: null, detail: text };
}

/** "n of 4" for each setup screen. Typing it in replaces reading and checking. */
const STEPS: Record<string, number> = { import: 1, reading: 2, focus: 2, review: 3, audience: 3, story: 4 };
export const SETUP_STEPS = 4;
export function setupStep(screen: string): number {
  return STEPS[screen] ?? 1;
}
