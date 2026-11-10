import React from "react";
import { X } from "lucide-react";
import { cardClass } from "@/components/ui/Card";

/** Shared pieces of the Brand page, so every card and field reads the same. */

export const brandText = {
  title: "text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink",
  line: "text-[15px] leading-relaxed text-muted",
  value: "text-[17px] leading-relaxed text-ink",
  label: "block text-[15px] font-medium text-ink",
  note: "text-sm text-subtle",
  link: "cursor-pointer rounded text-[15px] text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
  /** A grey row inside a card: one saved item. */
  row: "rounded-2xl bg-surface-2 px-4 py-3.5",
  iconButton: "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle hover:bg-surface-3 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand",
};

/** One card: a title, one line, an optional quiet action on the right, then the content. */
export function BrandCard({ title, line, action, children, id }: { title: string; line?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} aria-label={title} className={cardClass({ className: "space-y-5" })}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-1">
          <h2 className={brandText.title}>{title}</h2>
          {line && <p className={brandText.line}>{line}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A removable pill: a topic, a phrase, a word. */
export function Chip({ children, onRemove, removeLabel }: { children: React.ReactNode; onRemove?: () => void; removeLabel?: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-surface-2 py-1 pl-3.5 pr-1 text-[15px] text-ink">
      <span className="min-w-0 break-words py-0.5">{children}</span>
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle hover:bg-surface-3 hover:text-ink">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : (
        <span className="w-2.5" />
      )}
    </span>
  );
}
