import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Calm pill buttons (Apple-style). One primary (filled blue) per screen;
 * secondary is outlined blue, ghost is quiet text. Old variant names map onto
 * these so every caller keeps working.
 */
export type ButtonVariant = "primary" | "soft" | "secondary" | "light" | "ghost" | "gold" | "coral" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium select-none cursor-pointer " +
  "transition-colors duration-150 transition-transform active:scale-[0.985] disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  /** An outlined blue action that should not compete with the primary. */
  soft: "border border-brand text-brand bg-transparent hover:bg-brand/5",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  /** White, for third-party sign-in buttons that must look like the provider's. */
  light: "border border-line-strong bg-white text-ink hover:bg-surface-2",
  ghost: "bg-transparent text-brand hover:bg-brand/5",
  gold: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  coral: "bg-brand text-brand-ink hover:bg-brand-hover",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-12 px-7 text-[17px]",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  /** Kept for old callers; no longer changes the label. */
  shout?: boolean;
  className?: string;
}

/** The class string, for elements that are not a <button>, such as a <Link>. */
export function buttonStyles({ variant = "primary", size = "md", block, className = "" }: ButtonStyleOptions = {}) {
  return [base, variants[variant], sizes[size], block && "w-full", className]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  /** Shows a spinner and blocks clicks, keeping the label so the button does not change width. */
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant, size, block, shout, className, loading, icon, disabled, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, block, shout, className })}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
