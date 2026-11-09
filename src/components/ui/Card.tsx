import React from "react";

/**
 * The design's surfaces (tasks/20): a white card with a soft shadow and no
 * border, or a quiet grey well for empty states. `cardClass()` gives the same
 * look to a Link or any other element.
 */
export type CardTone = "default" | "well" | "brand" | "coral" | "gold";
export type CardPad = "none" | "md" | "lg";

const tones: Record<CardTone, string> = {
  default: "bg-surface shadow-soft",
  well: "bg-surface-2",
  brand: "bg-brand/5",
  coral: "bg-coral/5",
  gold: "bg-gold/5",
};

const pads: Record<CardPad, string> = {
  none: "",
  md: "p-6 sm:p-8",
  lg: "p-7 sm:p-10",
};

export function cardClass({ tone = "default", pad = "md", className = "" }: { tone?: CardTone; pad?: CardPad; className?: string } = {}) {
  return `rounded-[28px] ${tones[tone]} ${pads[pad]} ${className}`.trim();
}

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  pad?: CardPad;
  as?: "div" | "section" | "article";
}

export function Card({ tone, pad, as: Tag = "div", className, ...rest }: CardProps) {
  return <Tag className={cardClass({ tone, pad, className })} {...rest} />;
}
