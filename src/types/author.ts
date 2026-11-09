import type { MemoryDisclosure, MemoryKind } from "@/constants/contentLanes";

/** The one ICP a workspace writes for, as the Brand page edits it. */
export interface IcpProfileItem {
  who: string;
  role: string;
  company_type: string;
  pains: string[];
  decisions: string[];
  questions: string[];
  buying_triggers: string[];
  vocabulary: string[];
  /** OUTCOME: they buy the result; TECHNICAL: they want to know how it works. */
  buyer: "OUTCOME" | "TECHNICAL";
  updated_at: string | null;
}

export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  content: string;
  disclosure: MemoryDisclosure;
  source: string;
  is_active: boolean;
  /** Ideas whose memory_ids include this item. Always 0 before the phase 3 harvester. */
  used_in_ideas: number;
  created_at: string;
}

export type MemoryIssueKind = "CONTACT" | "FIGURE" | "CLIENT_NAME" | "PERSON" | "PLACE" | "IDENTIFIER" | "CONFIDENTIAL";

export interface MemoryIssue {
  /** Exact span from the text. */
  text: string;
  kind: MemoryIssueKind;
  reason: string;
  /** "code" findings are certain; "model" findings were verified to exist in the text. */
  found_by: "code" | "model";
}

export interface MemoryCheckResult {
  issues: MemoryIssue[];
  /** A rewrite with the specifics removed, or null when there is nothing to remove or the model was unavailable. */
  generalized: string | null;
  /** Material Minions must not store at all (decision D4). Saving is blocked until it is removed. */
  confidential: boolean;
  /** False when the model could not be reached; only the code checks ran. */
  model_checked: boolean;
}

export interface CompletenessPrompt {
  id: string;
  text: string;
  /** Where on the Brand page the user can act on it. */
  tab: "experience" | "voice-proof" | "overview";
}

export interface BrandCompleteness {
  score: number;
  prompts: CompletenessPrompt[];
}
