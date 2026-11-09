"use client";

import React, { useEffect, useRef, useState } from "react";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  /** Draws a hairline above this item. */
  divider?: boolean;
}

/**
 * The "⋯" button and its small menu. Closes on a pick, a click outside, or
 * Escape; arrow keys move between items.
 */
export default function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const buttons = [...(box.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === "ArrowDown" ? (at + 1) % buttons.length : (at - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl leading-none text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-30 flex min-w-[200px] flex-col rounded-[14px] bg-surface p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)]">
          {items.map((item) => (
            <React.Fragment key={item.label}>
              {item.divider && <div className="mx-2 my-1 h-px bg-line" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-surface-2 focus:bg-surface-2 focus:outline-none ${item.danger ? "text-danger" : "text-ink"}`}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
