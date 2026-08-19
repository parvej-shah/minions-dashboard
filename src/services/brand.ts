import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND_SETTINGS } from "@/constants/brand";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import type { BrandSettings } from "@/types";

/**
 * Brand settings plus the live directive set.
 *
 * Directives come from the database; when none are stored the list is empty
 * rather than back-filled with a hardcoded starter set, so an unseeded brand
 * table is visible as such.
 */
export async function getBrandSettings(): Promise<BrandSettings> {
  const directives = await prisma.brandDirective
    .findMany({ where: { category: { not: "DISTRIBUTION" } }, orderBy: { createdAt: "asc" } })
    .catch(() => []);

  return {
    ...DEFAULT_BRAND_SETTINGS,
    directives: directives.map(toDirectiveDTO),
    updated_at: new Date().toISOString(),
  };
}
