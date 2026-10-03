import React from "react";

/**
 * Surfaces. "raised" has the same thick bottom edge as the buttons, for cards
 * that are themselves tappable or that hold the screen's main action.
 */
export type CardTone = "default" | "raised" | "brand" | "coral" | "gold";

const tones: Record<CardTone, string> = {
  default: "border-2 border-line bg-surface",
  raised: "border-2 border-b-4 border-line bg-surface",
  brand: "border-2 border-b-4 border-brand/40 border-b-brand-edge/70 bg-[#0F1C1D]",
  coral: "border-2 border-b-4 border-coral/35 border-b-coral-edge/70 bg-[#1A1210]",
  gold: "border-2 border-b-4 border-gold/35 border-b-gold-edge/70 bg-[#1A150B]",
};

function cardStyles(tone: CardTone = "default", className = "") {
  return `rounded-2xl p-5 sm:p-6 ${tones[tone]} ${className}`;
}

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  as?: "div" | "section" | "article";
}

export function Card({ tone = "default", as: Tag = "div", className = "", ...rest }: CardProps) {
  return <Tag className={cardStyles(tone, className)} {...rest} />;
}
