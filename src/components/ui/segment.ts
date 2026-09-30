/**
 * Segmented tabs (Queue | Stream | Calendar, Preview | Edit...): the chosen
 * segment is a small brand key sitting on its edge; the rest are quiet text.
 * Use as `${segment.on}` / `${segment.off}` inside the segment's className.
 */
export const segment = {
  on: "bg-brand text-brand-ink font-extrabold shadow-[0_3px_0_var(--color-brand-edge)]",
  off: "text-muted hover:bg-surface-2 hover:text-ink",
};
