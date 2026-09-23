import type { MemoryKind } from "@/constants/contentLanes";
import type { BrandCompleteness, CompletenessPrompt } from "@/types/author";

/**
 * How much Minions knows about the author, and the next three things worth
 * telling it. Onboarding stays short (decision D3); this is how the rest of
 * the profile gets filled in, a few small prompts at a time.
 *
 * Weights favour what the authority gate needs: an idea only passes when it
 * rests on the author's real experience, so memory counts most.
 */
export interface CompletenessInput {
  icp: { who: string; pains: string[]; decisions: string[]; questions: string[] };
  memoryKinds: MemoryKind[];
  hasPositioning: boolean;
  toneExamples: number;
  approvedProofs: number;
}

interface Check extends CompletenessPrompt {
  weight: number;
  done: boolean;
}

export const MEMORY_TARGET = 10;

export function computeCompleteness(input: CompletenessInput): BrandCompleteness {
  const kinds = new Set(input.memoryKinds);
  const count = input.memoryKinds.length;
  const checks: Check[] = [
    { id: "icp-who", weight: 10, tab: "experience", done: input.icp.who.trim().length >= 20, text: "Describe your ideal customer in a sentence: who they are and what they run." },
    { id: "memory-first", weight: 10, tab: "experience", done: count >= 3, text: "Add three things you have worked on. Every idea Minions writes has to rest on your real experience." },
    { id: "icp-pains", weight: 10, tab: "experience", done: input.icp.pains.length > 0, text: "Name the problem that costs your customers the most." },
    { id: "memory-lesson", weight: 10, tab: "experience", done: kinds.has("LESSON") || kinds.has("STORY"), text: "Add one lesson from a project that went wrong, and what you changed." },
    { id: "memory-current", weight: 10, tab: "experience", done: kinds.has("CURRENT_WORK"), text: "Tell Minions what you are working on right now." },
    { id: "icp-decisions", weight: 10, tab: "experience", done: input.icp.decisions.length + input.icp.questions.length > 0, text: "Add a question your customers keep asking, or a decision they are stuck on." },
    { id: "voice-sample", weight: 10, tab: "voice-proof", done: input.toneExamples > 0, text: "Paste one thing you have written, so drafts sound like you." },
    { id: "memory-ten", weight: 10, tab: "experience", done: count >= MEMORY_TARGET, text: `Build up to ${MEMORY_TARGET} experience items. You have ${count}.` },
    { id: "memory-opinion", weight: 5, tab: "experience", done: kinds.has("OPINION"), text: "Add an opinion you hold that others in your field might not." },
    { id: "memory-question", weight: 5, tab: "experience", done: kinds.has("ICP_QUESTION"), text: "Save a question a customer asked you this month." },
    { id: "proof", weight: 5, tab: "voice-proof", done: input.approvedProofs > 0, text: "Add one piece of proof with a source link, so drafts can cite it." },
    { id: "positioning", weight: 5, tab: "overview", done: input.hasPositioning, text: "Write your positioning: what you do and for whom, in one line." },
  ];

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.filter((c) => c.done).reduce((n, c) => n + c.weight, 0);
  return {
    score: Math.round((100 * earned) / total),
    // In list order, which is the order they unblock each other in.
    prompts: checks.filter((c) => !c.done).slice(0, 3).map(({ id, text, tab }) => ({ id, text, tab })),
  };
}
