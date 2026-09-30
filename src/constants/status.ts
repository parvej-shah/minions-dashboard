import type { AssetStatus, IdeaStatus } from "@/types";

export interface StatusStyle {
  label: string;
  /** Tailwind classes for a small pill badge. */
  className: string;
}

const NEUTRAL: StatusStyle = {
  label: "Unknown",
  className: "bg-surface-2 text-muted border-line",
};

const TEAL = "bg-brand/10 text-brand border-brand/30";
const AMBER = "bg-gold/10 text-gold border-gold/30";
const BLUE = "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30";
const CORAL = "bg-coral/10 text-coral border-coral/30";
const RED = "bg-danger/10 text-danger border-danger/30";
const SLATE = "bg-surface-2 text-muted border-line";

export const ASSET_STATUS_STYLES: Record<AssetStatus, StatusStyle> = {
  DRAFT: { label: "Draft", className: SLATE },
  PENDING_REVIEW: { label: "Pending Review", className: AMBER },
  APPROVED: { label: "Approved", className: BLUE },
  SCHEDULED: { label: "Scheduled", className: BLUE },
  PUBLISHED: { label: "Published", className: TEAL },
  UNPUBLISHED: { label: "Unpublished", className: SLATE },
  BLOCKED: { label: "Blocked", className: RED },
  REJECTED: { label: "Rejected", className: RED },
};

export const IDEA_STATUS_STYLES: Record<IdeaStatus, StatusStyle> = {
  HARVESTED: { label: "Harvested", className: BLUE },
  REFINED: { label: "Refined", className: BLUE },
  PICKED: { label: "Picked", className: AMBER },
  QUEUED: { label: "Queued", className: CORAL },
  CLAIMED: { label: "Claimed", className: AMBER },
  DRAFTING: { label: "Drafting", className: AMBER },
  DRAFTED: { label: "Drafted", className: TEAL },
  REVIEW: { label: "In Review", className: TEAL },
  PUBLISHED: { label: "Published", className: TEAL },
  REJECTED: { label: "Rejected", className: RED },
  FAILED: { label: "Failed", className: RED },
  DISCARDED: { label: "Discarded", className: SLATE },
};

export function assetStatusStyle(status: string): StatusStyle {
  return ASSET_STATUS_STYLES[status as AssetStatus] ?? NEUTRAL;
}

export function ideaStatusStyle(status: string): StatusStyle {
  return IDEA_STATUS_STYLES[status as IdeaStatus] ?? NEUTRAL;
}
