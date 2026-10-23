import type { BrandVoiceQuestionnaire } from "@/types";

/**
 * Brand import: the author drops their LinkedIn PDF (or résumé) and website,
 * and setup is read from them instead of typed. The server streams what it
 * finds as ImportEvents; the browser shows each one landing, holds the result
 * until the author reviews it, then sends the kept parts to the apply route.
 */

export type ImportMode = "onboarding" | "refresh";

/** Experience an import may propose. Stories, lessons and opinions need the author, not a résumé. */
export type ImportedExperienceKind = "CURRENT_WORK" | "PAST_EXPERIENCE";

export interface ImportedIdentity {
  name: string;
  headline: string;
  company: string;
}

export interface ImportedFocus {
  /** What the author wants to be known for, one or two sentences. */
  focus: string;
  topics: string[];
  industry: string;
}

export interface ImportedVoice {
  questionnaire: BrandVoiceQuestionnaire;
  /** The author's own About text, kept verbatim as a writing sample. */
  about: string | null;
}

export interface ImportedIcp {
  who: string;
  role: string;
  company_type: string;
  pains: string[];
  decisions: string[];
  questions: string[];
  buying_triggers: string[];
  vocabulary: string[];
}

export interface ImportedExperience {
  id: string;
  kind: ImportedExperienceKind;
  content: string;
  /** Where it was read, e.g. "LinkedIn profile" or "getminions.ai/about". */
  from: string;
}

export interface ImportedProof {
  id: string;
  claim: string;
  /** The sentence on the site that states it, shown so the author can judge it. */
  quote: string;
  source_url: string;
  source_title: string;
}

export type ImportStep = "profile" | "website" | "voice" | "audience" | "experience" | "proof";

export type ImportEvent =
  | { type: "step"; step: ImportStep; state: "active" | "done" | "skipped"; detail?: string }
  /** A real line from what is being read, for the "reading" feed. */
  | { type: "glimpse"; text: string; from: string }
  | { type: "identity"; identity: ImportedIdentity }
  | { type: "focus"; focus: ImportedFocus }
  | { type: "voice"; voice: ImportedVoice }
  | { type: "audience"; icp: ImportedIcp }
  | { type: "experience"; items: ImportedExperience[] }
  | { type: "proof"; items: ImportedProof[] }
  | { type: "website"; domain: string; pages: { url: string; title: string }[] }
  | { type: "done" }
  | { type: "error"; message: string };

/** Everything one import found, accumulated from its events. */
export interface BrandImport {
  websiteUrl: string;
  identity: ImportedIdentity | null;
  focus: ImportedFocus | null;
  voice: ImportedVoice | null;
  icp: ImportedIcp | null;
  experience: ImportedExperience[];
  proofs: ImportedProof[];
  website: { domain: string; pages: { url: string; title: string }[] } | null;
}

export const EMPTY_IMPORT: BrandImport = {
  websiteUrl: "",
  identity: null,
  focus: null,
  voice: null,
  icp: null,
  experience: [],
  proofs: [],
  website: null,
};

/** Folds one streamed event into the import so far. */
export function applyImportEvent(state: BrandImport, event: ImportEvent): BrandImport {
  switch (event.type) {
    case "identity":
      return { ...state, identity: event.identity };
    case "focus":
      return { ...state, focus: event.focus };
    case "voice":
      return { ...state, voice: event.voice };
    case "audience":
      return { ...state, icp: event.icp };
    case "experience":
      return { ...state, experience: [...state.experience, ...event.items] };
    case "proof":
      return { ...state, proofs: [...state.proofs, ...event.items] };
    case "website":
      return { ...state, website: { domain: event.domain, pages: event.pages } };
    default:
      return state;
  }
}

/** What the author kept on the review screen; the apply route's body. */
export interface ImportApproval {
  icp: ImportedIcp | null;
  experience: { kind: ImportedExperienceKind; content: string }[];
  proofs: { claim: string; source_url: string; source_title: string }[];
  voice: ImportedVoice | null;
  /** The profile's LinkedIn headline; it becomes the cover sign-off when none is set. */
  headline?: string | null;
}
