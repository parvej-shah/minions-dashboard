import type { IdeaSource } from "@prisma/client";
import type { IdeaSourceItem, IdeaSourceKind } from "@/constants/ideaSources";

export function toIdeaSourceDTO(row: IdeaSource): IdeaSourceItem {
  return {
    id: row.id,
    kind: row.kind as IdeaSourceKind,
    label: row.label,
    url: row.url,
    query: row.query,
    max_items: row.maxItems,
    is_active: row.isActive,
    last_error: row.lastError,
    last_fetched_at: row.lastFetchedAt?.toISOString() ?? null,
  };
}
