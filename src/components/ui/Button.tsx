import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

/**
 * The tactile button: a thick bottom edge the button sinks into when pressed,
 * like a physical key. One primary (brand) button per screen; everything else
 * is soft, secondary or ghost.
 */
export type ButtonVariant = "primary" | "soft" | "secondary" | "light" | "ghost" | "gold" | "coral" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold select-none cursor-pointer " +
  "transition-[transform,border-width,background-color,color] duration-75 " +
  "active:translate-y-1 active:border-b-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand " +
  "disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-b-4 aria-disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-b-4 border-brand-edge bg-brand text-brand-ink hover:bg-brand-hover " +
    "disabled:bg-line disabled:border-[#16202B] disabled:text-subtle",
  /** Brand-tinted: a real action that should not compete with the screen's primary. */
  soft:
    "border-2 border-b-4 border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 hover:border-brand/50 " +
    "disabled:text-subtle disabled:border-line disabled:bg-transparent",
  secondary:
    "border-2 border-b-4 border-line bg-surface text-ink hover:bg-surface-2 hover:border-line-strong " +
    "disabled:text-subtle",
  /** White, for third-party sign-in buttons that must look like the provider's. */
  light: "border-b-4 border-[#CBD5E1] bg-white text-canvas hover:bg-ink disabled:text-subtle",
  ghost:
    "border-b-4 border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-ink active:border-b-0 disabled:text-subtle",
  gold: "border-b-4 border-gold-edge bg-gold text-[#1F1300] hover:bg-[#FBB12E]",
  coral: "border-b-4 border-coral-edge bg-coral text-[#2A0A02] hover:bg-[#FF8266]",
  danger: "border-b-4 border-danger-edge bg-danger text-white hover:bg-[#F25C5C]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  /** Uppercase lesson-app label; reserve for big one-word actions (CONTINUE, CHECK). */
  shout?: boolean;
  className?: string;
}

/** The class string, for elements that are not a <button> or <Link>. */
export function buttonStyles({ variant = "primary", size = "md", block, shout, className = "" }: ButtonStyleOptions = {}) {
  return [base, variants[variant], sizes[size], block && "w-full", shout && "uppercase tracking-wider", className]
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

export interface ButtonLinkProps extends ButtonStyleOptions, Omit<React.ComponentProps<typeof Link>, "className"> {
  icon?: React.ReactNode;
}

export function ButtonLink({ variant, size, block, shout, className, icon, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, block, shout, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
