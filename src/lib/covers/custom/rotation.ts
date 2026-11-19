/**
 * When a workspace's own designs are used (decided 2026-11-19): by default
 * they alternate with the built-in designs, so a feed still changes post to
 * post; "Use only my designs" turns the built-ins off. Among the workspace's
 * designs the least recently used goes next.
 */
export interface DesignRef {
  id: string;
  version: number;
}

type RecentCover = { layout?: string; custom?: { id?: string } } | null | undefined;

export function pickCustomDesign(designs: DesignRef[], recent: RecentCover[], opts: { onlyMine: boolean; firstPost: boolean }): DesignRef | null {
  if (!designs.length) return null;
  if (!opts.onlyMine) {
    // The first post keeps the bold opener, and a custom cover never follows a custom cover.
    if (opts.firstPost || recent[0]?.layout === "CUSTOM") return null;
  }
  const lastUse = (d: DesignRef) => {
    const i = recent.findIndex((r) => r?.layout === "CUSTOM" && r.custom?.id === d.id);
    return i < 0 ? Infinity : i;
  };
  return [...designs].sort((a, b) => lastUse(b) - lastUse(a))[0];
}

/** The design a reviewer picked, from the workspace's active designs only; null when it is archived or not theirs. */
export const pickedDesign = (active: DesignRef[], id: string): DesignRef | null => active.find((d) => d.id === id) ?? null;

/** The "Use only my designs" switch, kept in the brand's visual assets JSON beside the cut-out. */
export const readOnlyMine = (visualAssets: unknown): boolean => (visualAssets as { cover_custom_only?: unknown } | null)?.cover_custom_only === true;
