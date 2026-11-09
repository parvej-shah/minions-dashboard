/**
 * Segmented control (All | Needs you | Posted, Preview | Edit...): a soft gray
 * track where the chosen segment is a white pill. Put `segment.track` on the
 * wrapper, `${segment.on}` / `${segment.off}` on each segment.
 * It never wraps: on a narrow phone the track scrolls sideways instead.
 */
export const segment = {
  track: "flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-surface-3 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  on: "shrink-0 whitespace-nowrap rounded-full bg-surface text-ink font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
  off: "shrink-0 whitespace-nowrap rounded-full text-muted hover:text-ink",
};
