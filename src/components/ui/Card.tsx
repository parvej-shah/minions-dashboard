import React from "react";

/**
 * Surfaces: white with a soft shadow, no borders. Tones are kept for old
 * callers; brand/coral/gold become a quiet tinted well.
 */
export type CardTone = "default" | "raised" | "brand" | "coral" | "gold";

const tones: Record<CardTone, string> = {
  default: "bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)]",
  raised: "bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.05)]",
  brand: "bg-brand/5",
  coral: "bg-coral/5",
  gold: "bg-gold/5",
};

function cardStyles(tone: CardTone = "default", className = "") {
  return `rounded-3xl p-6 sm:p-8 ${tones[tone]} ${className}`;
}

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  as?: "div" | "section" | "article";
}

export function Card({ tone = "default", as: Tag = "div", className = "", ...rest }: CardProps) {
  return <Tag className={cardStyles(tone, className)} {...rest} />;
}
