import type { BrandDirective } from "@prisma/client";
import type { AudienceScope, BrandCategory, BrandDirectiveItem } from "@/types";

/** Prisma row -> the brand-directive wire shape. */
export function toDirectiveDTO(row: BrandDirective): BrandDirectiveItem {
  return {
    id: row.id,
    category: row.category as BrandCategory,
    key: row.ruleKey,
    content: row.instruction,
    priority: row.priority as 1 | 2 | 3,
    audience_scope: row.audienceScope as AudienceScope,
    is_active: row.isActive,
    updated_at: row.updatedAt.toISOString(),
  };
}
