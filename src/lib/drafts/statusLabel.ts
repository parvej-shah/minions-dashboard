import type { AssetStatus } from "@/types/asset";

/** What a draft's status is called on screen; the same words on every page. */
export const STATUS_LABEL: Record<AssetStatus, string> = {
  DRAFT: "Being written",
  PENDING_REVIEW: "Ready for review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  UNPUBLISHED: "Offline",
  BLOCKED: "Needs a fix",
  REJECTED: "Rejected",
};

export const statusLabel = (status: AssetStatus): string => STATUS_LABEL[status] ?? "Draft";
