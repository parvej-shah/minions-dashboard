import type { BrandImport } from "@/lib/brandImport/types";
import type { AiSuggestions, GeneratedDirective } from "@/lib/ai/brandCopilot";
import { DEFAULT_WRITER_EXPERTISE, type WriterExpertise } from "@/constants/writerExpertise";
import type { LinkedInProfile } from "@/types";

/** What the first-post answer is, as a ProfessionalMemory kind. PAST_EXPERIENCE only arrives by picking an item a brand import found. */
export type StoryKind = "LESSON" | "OPINION" | "CURRENT_WORK" | "PAST_EXPERIENCE";
export type PublishingMode = "review" | "auto";

/** Every answer the setup wizard collects; the browser keeps it so a reload or an OAuth round trip loses nothing. */
export interface WizardFields {
  step: number;
  businessName: string;
  businessNameFromLinkedIn: boolean;
  websiteUrl: string;
  audienceDescription: string;
  contentFocus: string;
  writerExpertise: WriterExpertise;
  industry: string;
  selectedPresetId: string | null;
  channels: string[];
  publishingMode: PublishingMode;
  importedVoiceCount: number;
  linkedInProfile: LinkedInProfile | null;
  postSnippet: string | null;
  aiSuggestions: AiSuggestions | null;
  selectedVoice: string;
  customSampleText: string;
  mythAnswer: string;
  differentiatorAnswer: string;
  avoidAnswer: string;
  directives: GeneratedDirective[];
  positioningSummary: string;
  storyText: string;
  storyKind: StoryKind;
  /** What the LinkedIn PDF and website import found, as edited on the review screen. */
  brandImport: BrandImport | null;
  /** Ids of the website claims the author ticked as true. */
  approvedProofs: string[];
  keepImportedVoice: boolean;
}

export const INITIAL_FIELDS: WizardFields = {
  step: 0,
  businessName: "",
  businessNameFromLinkedIn: false,
  websiteUrl: "",
  audienceDescription: "",
  contentFocus: "",
  writerExpertise: DEFAULT_WRITER_EXPERTISE,
  industry: "",
  selectedPresetId: null,
  channels: ["linkedin"],
  publishingMode: "review",
  importedVoiceCount: 0,
  linkedInProfile: null,
  postSnippet: null,
  aiSuggestions: null,
  selectedVoice: "",
  customSampleText: "",
  mythAnswer: "",
  differentiatorAnswer: "",
  avoidAnswer: "",
  directives: [],
  positioningSummary: "",
  storyText: "",
  storyKind: "LESSON",
  brandImport: null,
  approvedProofs: [],
  keepImportedVoice: true,
};

const STORY_KINDS: StoryKind[] = ["LESSON", "OPINION", "CURRENT_WORK", "PAST_EXPERIENCE"];
const PUBLISHING_MODES: PublishingMode[] = ["review", "auto"];

/** One draft per account, so a new signup on the same browser never inherits the previous account's answers. */
export const draftKey = (userId: string) => `minions_onboarding_draft:${userId}`;

/** Fields that start as null: the saved value must be a string for these, an object for the rest. */
const NULLABLE_STRINGS = new Set(["selectedPresetId", "postSnippet"]);

function hasInitialType(key: string, initial: unknown, value: unknown): boolean {
  if (initial === null) return NULLABLE_STRINGS.has(key) ? typeof value === "string" : value !== null && typeof value === "object";
  if (Array.isArray(initial)) return Array.isArray(value);
  return typeof value === typeof initial;
}

/** Keeps only the saved values that have the right type; anything else falls back to the default. */
export function parseDraft(raw: unknown): Partial<WizardFields> {
  if (typeof raw !== "object" || raw === null) return {};
  const saved = raw as Record<string, unknown>;
  const draft: Record<string, unknown> = {};
  for (const [key, initial] of Object.entries(INITIAL_FIELDS)) {
    if (hasInitialType(key, initial, saved[key])) draft[key] = saved[key];
  }
  if ("publishingMode" in draft && !PUBLISHING_MODES.includes(draft.publishingMode as PublishingMode)) delete draft.publishingMode;
  if ("storyKind" in draft && !STORY_KINDS.includes(draft.storyKind as StoryKind)) delete draft.storyKind;
  return draft as Partial<WizardFields>;
}

export function readDraft(key: string): Partial<WizardFields> {
  try {
    const saved = localStorage.getItem(key);
    return saved ? parseDraft(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
}

export function writeDraft(key: string, fields: WizardFields): void {
  try {
    localStorage.setItem(key, JSON.stringify(fields));
  } catch {
    // Storage is full or blocked; the wizard works without a saved draft.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
