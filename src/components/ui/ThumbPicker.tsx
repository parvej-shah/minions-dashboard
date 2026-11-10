"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export interface ThumbOption {
  id: string;
  label: string;
  /** A sample picture of the choice. Without one, `icon` fills the tile. */
  src?: string;
  icon?: React.ReactNode;
}

const SIZES = {
  /** A 4:5 poster. */
  portrait: { tile: "w-[84px]", frame: "aspect-[4/5]", px: { width: 216, height: 270 } },
  /** Two carousel pages side by side. */
  wide: { tile: "w-[156px]", frame: "aspect-[32/27]", px: { width: 320, height: 270 } },
};

/**
 * Pick one by its picture, like the Lock Screen or Photos filters: a row of
 * tiles that scrolls sideways (or wraps, as `grid`), the chosen one ringed.
 * Arrow keys move between tiles; Enter or Space picks, so browsing never
 * redraws anything.
 */
export default function ThumbPicker({
  label,
  options,
  selected,
  onSelect,
  busy,
  disabled,
  size = "portrait",
  wrap = false,
}: {
  label: string;
  options: ThumbOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** The tile being drawn right now. */
  busy?: string | null;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  /** Wrap into rows instead of one sideways row. */
  wrap?: boolean;
}) {
  const group = useRef<HTMLDivElement>(null);
  const s = SIZES[size];
  const current = options.some((o) => o.id === selected) ? selected : options[0]?.id;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const tiles = Array.from(group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    const at = tiles.indexOf(document.activeElement as HTMLButtonElement);
    tiles[(at + step + tiles.length) % tiles.length]?.focus();
  };

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={
        wrap
          ? "grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-3 gap-y-4 p-2 -m-2"
          : "-mx-2 flex snap-x scroll-px-2 gap-3 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {options.map((o) => {
        const on = o.id === selected;
        const drawing = busy === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-busy={drawing || undefined}
            tabIndex={o.id === current ? 0 : -1}
            disabled={disabled}
            onClick={() => !on && onSelect(o.id)}
            className={`group shrink-0 snap-start space-y-1.5 text-center focus-visible:outline-none disabled:cursor-not-allowed ${wrap ? "w-full" : s.tile}`}
          >
            <span
              className={`relative block overflow-hidden rounded-xl bg-surface-2 transition-[transform,box-shadow] duration-200 ease-out group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand/60 ${s.frame} ${
                on ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "ring-1 ring-line group-hover:ring-line-strong"
              } ${disabled && !on ? "opacity-50" : ""}`}
            >
              {o.src ? (
                <Image src={o.src} alt="" width={s.px.width} height={s.px.height} unoptimized className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-brand">{o.icon}</span>
              )}
              {drawing && (
                <span className="absolute inset-0 flex items-center justify-center bg-surface/60">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
                </span>
              )}
            </span>
            <span className={`block truncate text-[12px] leading-tight ${on ? "font-medium text-ink" : "text-muted"}`}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
