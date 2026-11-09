import { buttonStyles } from "@/components/ui/Button";

/** Buttons inside the full-screen story session: the shared calm pill at its large size. */
export const sessionButtons = {
  primary: buttonStyles({ size: "lg" }),
  secondary: buttonStyles({ variant: "secondary", size: "lg" }),
  ghost: buttonStyles({ variant: "ghost", size: "lg" }),
  chip: "rounded-full border border-line bg-surface px-4 py-2 text-[15px] text-ink transition-colors cursor-pointer hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50",
};
