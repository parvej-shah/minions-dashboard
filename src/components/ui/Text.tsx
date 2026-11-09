import React from "react";
import Link from "next/link";

/** Shared headings for the calm screens (tasks/20), so every page reads the same. */

export type StatusTone = "coral" | "success" | "muted" | "brand";

export const STATUS_TEXT: Record<StatusTone, string> = {
  coral: "text-coral",
  success: "text-success",
  muted: "text-muted",
  brand: "text-brand",
};

/** "● Needs you": a small coloured status label above a heading or under a cover. */
export function StatusLabel({ tone, children, className = "" }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-semibold ${STATUS_TEXT[tone]} ${className}`}>● {children}</p>;
}

/** The big page title, with an optional small line above it (the date, a count). */
export function PageHeader({ kicker, title, children }: { kicker?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="space-y-2">
      {kicker && <p className="text-[15px] text-muted">{kicker}</p>}
      <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-5xl">{title}</h1>
      {children && <div className="pt-1 text-[17px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

/** A section title with an optional "See all ›" link on the right. */
export function SectionHeader({ id, title, href, linkLabel }: { id?: string; title: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={id} className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-[15px] text-brand hover:underline">
          {linkLabel} ›
        </Link>
      )}
    </div>
  );
}

/** The large heading inside a hero card ("2 posts are ready for your OK."). */
export function CardTitle({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`text-[28px] font-bold leading-[1.15] tracking-[-0.025em] text-ink sm:text-[32px] ${className}`}>
      {children}
    </h2>
  );
}
