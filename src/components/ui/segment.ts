/**
 * Segmented control (All | Needs you | Posted, Preview | Edit...): a soft gray
 * track where the chosen segment is a white pill. Put `segment.track` on the
 * wrapper, `${segment.on}` / `${segment.off}` on each segment.
 */
export const segment = {
  track: "inline-flex flex-wrap gap-1 rounded-full bg-surface-3 p-1",
  on: "rounded-full bg-surface text-ink font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
  off: "rounded-full text-muted hover:text-ink",
};
