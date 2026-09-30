import { buttonStyles } from "@/components/ui/Button";

/** Lesson-screen buttons: the shared tactile button at its big, uppercase size. */
const lesson = { shout: true, className: "min-h-12" } as const;

export const chunky = {
  primary: buttonStyles({ variant: "primary", ...lesson }),
  amber: buttonStyles({ variant: "gold", ...lesson }),
  ghost: buttonStyles({ variant: "secondary", ...lesson, className: "min-h-12 text-muted hover:text-ink" }),
  chip: "rounded-xl border-2 border-b-4 border-line bg-surface px-3 py-2 text-sm font-semibold text-[#CBD5E1] transition-[transform,border-width] duration-75 cursor-pointer hover:border-line-strong active:translate-y-0.5 active:border-b-2",
};
