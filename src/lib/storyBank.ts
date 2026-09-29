import type { MemoryKind } from "@/constants/contentLanes";

/**
 * The story bank: how many of the author's experience items the harvester has
 * not leaned on lately, and the short session that tops it up. Each idea
 * needs something the author lived; once every item has been used, ideas start
 * retelling old stories. When few unused items remain, the home page asks for
 * a few new ones, one quick question at a time.
 */

/** Unused items below this count as running low: about one harvest's worth. */
export const LOW_AT = 3;
/** A full bank: about three harvests before anything repeats. */
export const FULL_AT = 9;
/** Questions in one session. */
export const SESSION_SIZE = 3;
/** Author-written sources that count toward the weekly streak. */
export const STREAK_SOURCES = ["BRAND_PAGE", "WEEKLY_PULSE"] as const;

export interface StoryPrompt {
  id: string;
  kind: MemoryKind;
  question: string;
  hint: string;
  /** Tap to start the answer with these words. */
  starters: string[];
  placeholder: string;
}

export const STORY_PROMPTS: StoryPrompt[] = [
  {
    id: "client-change",
    kind: "STORY",
    question: "Think of the last client you helped. What did they ask for, and what did you actually change?",
    hint: "One client, one change. You choose later whether names can be public.",
    starters: ["A client asked me to", "What I actually changed was", "Before, they"],
    placeholder: "A client asked for more features. What they needed was a simpler first step, so I cut their setup to one screen.",
  },
  {
    id: "surprise",
    kind: "STORY",
    question: "When did a result surprise you? What did you expect, and what happened instead?",
    hint: "The gap between what you expected and what happened is the post.",
    starters: ["I expected", "What actually happened was", "It surprised me because"],
    placeholder: "I expected the new offer to bring more leads. Leads stayed flat, but the ones who came were far readier to buy.",
  },
  {
    id: "mistake",
    kind: "LESSON",
    question: "What is a mistake you made in your work, and what do you do differently now?",
    hint: "Small mistakes count. Readers trust people who show what they learned.",
    starters: ["I used to", "The mistake was", "Now I always"],
    placeholder: "I used to send clients three options. They picked the safest one every time. Now I send one and explain why.",
  },
  {
    id: "start-again",
    kind: "LESSON",
    question: "If you started your work again today, what would you do differently?",
    hint: "Think of one decision, not a whole career.",
    starters: ["If I started again, I would", "I wasted time on", "I would skip"],
    placeholder: "I would stop taking every project. My best work came from saying no to the ones outside my niche.",
  },
  {
    id: "field-wrong",
    kind: "OPINION",
    question: "What do most people in your field get wrong? Say what you believe instead.",
    hint: "A view some peers would disagree with makes the strongest posts.",
    starters: ["Most people think", "I believe", "The real problem is"],
    placeholder: "Most people in my field sell features. Clients buy the problem going away. Features are only how you get there.",
  },
  {
    id: "changed-mind",
    kind: "OPINION",
    question: "What did you used to believe about your work that you don't anymore?",
    hint: "What changed your mind is often the best part.",
    starters: ["I used to believe", "What changed my mind was", "Now I think"],
    placeholder: "I used to think more content meant more clients. What worked was fewer posts that each answered one real question.",
  },
  {
    id: "client-question",
    kind: "ICP_QUESTION",
    question: "What is a question a client or prospect asked you recently?",
    hint: "The exact words they used are gold. Add how you answered, if you did.",
    starters: ["Someone asked me", "The question was", "I told them"],
    placeholder: "A prospect asked: how long until this pays for itself? I told them to track one number for a month before deciding.",
  },
  {
    id: "working-on",
    kind: "CURRENT_WORK",
    question: "What are you working on right now, and who is it for?",
    hint: "Say what it is and whose problem it solves.",
    starters: ["Right now I am", "It is for", "The hard part is"],
    placeholder: "Right now I am rebuilding our onboarding for small teams. The hard part is cutting it to one step.",
  },
  {
    id: "tried",
    kind: "EXPERIMENT",
    question: "What did you try recently that you weren't sure would work? What happened?",
    hint: "It does not need to have worked. What you saw is enough.",
    starters: ["I tried", "I was not sure because", "So far"],
    placeholder: "I tried sending a short video instead of a written proposal. Clients replied faster and asked better questions.",
  },
  {
    id: "shaped-me",
    kind: "PAST_EXPERIENCE",
    question: "What is a project from your past that shaped how you work today?",
    hint: "What happened in it, and what you still do because of it.",
    starters: ["Years ago I", "That project taught me", "I still"],
    placeholder: "My first job was in customer support. I still start every project by reading what customers complain about.",
  },
];

/** Kinds in the order a session asks about them when the author has equal counts. */
const KIND_ORDER: MemoryKind[] = ["STORY", "LESSON", "ICP_QUESTION", "OPINION", "CURRENT_WORK", "EXPERIMENT", "PAST_EXPERIENCE"];

/**
 * The questions for one session: the kinds the author has fewest items of,
 * one question each. `daySeed` rotates the ties and the wording, so the set
 * holds for a day and changes the next.
 */
export function pickPrompts(counts: Partial<Record<string, number>>, daySeed: number, n = SESSION_SIZE): StoryPrompt[] {
  const len = KIND_ORDER.length;
  const offset = ((daySeed % len) + len) % len;
  const rotated = KIND_ORDER.map((_, i) => KIND_ORDER[(i + offset) % len]);
  const kinds = [...rotated].sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0)).slice(0, n);
  return kinds.map((kind) => {
    const options = STORY_PROMPTS.filter((p) => p.kind === kind);
    return options[Math.abs(daySeed) % options.length];
  });
}

export function promptById(id: unknown): StoryPrompt | undefined {
  return STORY_PROMPTS.find((p) => p.id === id);
}

export interface BankLevel {
  /** Active items no recent idea is built on. */
  unused: number;
  total: number;
  /** 0 to 1, for the meter. */
  level: number;
  low: boolean;
}

export function bankLevel(activeIds: string[], recentMemoryIds: string[][]): BankLevel {
  const used = new Set(recentMemoryIds.flat());
  const unused = activeIds.filter((id) => !used.has(id)).length;
  return { unused, total: activeIds.length, level: Math.min(1, unused / FULL_AT), low: unused < LOW_AT };
}

const DAY_MS = 86_400_000;

/** The Monday before a YYYY-MM-DD Monday. */
export function previousWeek(week: string): string {
  return new Date(Date.parse(`${week}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Weeks in a row the author added something, ending this week. A streak is
 * not broken until this week ends, so a quiet week so far counts back from
 * last week.
 */
export function streakWeeks(weeks: Set<string>, thisWeek: string): number {
  let week = weeks.has(thisWeek) ? thisWeek : previousWeek(thisWeek);
  let n = 0;
  while (weeks.has(week)) {
    n++;
    week = previousWeek(week);
  }
  return n;
}
