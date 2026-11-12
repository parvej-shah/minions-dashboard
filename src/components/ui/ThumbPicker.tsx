"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  canScroll,
  calculateDragScroll,
  getScrollDistance,
  shouldHandleWheel,
} from "@/lib/ui/cursorScroll";

export interface ThumbOption {
  id: string;
  label: string;
  /** A sample picture of the choice. Without one, `icon` fills the tile. */
  src?: string;
  /**
   * This post's own picture of the choice. The sample shows at once and this
   * fades in over it when it arrives; if it never does, the sample stays.
   */
  liveSrc?: string;
  icon?: React.ReactNode;
}

const SIZES = {
  /** A 4:5 poster. */
  portrait: { tile: "w-[84px]", frame: "aspect-[4/5]", px: { width: 216, height: 270 } },
  /** Two carousel pages side by side. */
  wide: { tile: "w-[156px]", frame: "aspect-[32/27]", px: { width: 320, height: 270 } },
};

/** The sample picture, with the post's own picture fading in over it when there is one. */
function TileImage({ o, px, draggable }: { o: ThumbOption; px: { width: number; height: number }; draggable?: boolean }) {
  const [live, setLive] = useState<"loading" | "shown" | "failed">("loading");
  // A new picture (the post's words changed) starts over.
  const [seen, setSeen] = useState(o.liveSrc);
  if (seen !== o.liveSrc) {
    setSeen(o.liveSrc);
    setLive("loading");
  }
  return (
    <>
      <Image src={o.src!} alt="" width={px.width} height={px.height} unoptimized draggable={draggable} className="h-full w-full object-cover pointer-events-none" />
      {o.liveSrc && live !== "failed" && (
        <Image
          key={o.liveSrc}
          src={o.liveSrc}
          alt=""
          width={px.width}
          height={px.height}
          unoptimized
          draggable={draggable}
          onLoad={() => setLive("shown")}
          onError={() => setLive("failed")}
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300 ${live === "shown" ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}

/**
 * Pick one by its picture, like the Lock Screen or Photos filters: a row of
 * tiles that scrolls sideways (or wraps, as `grid`), the chosen one ringed.
 *
 * Desktop cursor navigation:
 * - Floating chevrons (‹ / ›) with smooth animated jump.
 * - Mouse wheel vertical delta translates to horizontal scroll.
 * - Click-and-drag horizontal scrolling with cursor grab.
 * - Arrow keys move between tiles; Enter or Space picks.
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

  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasDragged: false,
  });

  const updateScrollState = useCallback(() => {
    const el = group.current;
    if (!el || wrap) {
      setScrollState({ canScrollLeft: false, canScrollRight: false });
      return;
    }
    const next = canScroll({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
    setScrollState((prev) =>
      prev.canScrollLeft === next.canScrollLeft && prev.canScrollRight === next.canScrollRight
        ? prev
        : next
    );
  }, [wrap]);

  // Sync scrollability on mount, resize, content change
  useEffect(() => {
    const el = group.current;
    if (!el || wrap) return;

    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateScrollState());
      ro.observe(el);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateScrollState);
    }

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (ro) ro.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateScrollState);
      }
    };
  }, [wrap, options, updateScrollState]);

  // Mouse wheel translation: vertical wheel rotates horizontal ribbon
  useEffect(() => {
    const el = group.current;
    if (!el || wrap) return;

    const onWheel = (e: WheelEvent) => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const { canScrollLeft: leftOk, canScrollRight: rightOk } = canScroll({
        scrollLeft,
        scrollWidth,
        clientWidth,
      });

      if (
        shouldHandleWheel({
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          canScrollLeft: leftOk,
          canScrollRight: rightOk,
        })
      ) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        updateScrollState();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [wrap, updateScrollState]);

  const scrollByDirection = (direction: -1 | 1) => {
    const el = group.current;
    if (!el) return;
    const distance = getScrollDistance(el.clientWidth, direction);
    el.scrollBy({ left: distance, behavior: "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wrap || !group.current || e.button !== 0) return;
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: group.current.scrollLeft,
      hasDragged: false,
    };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = group.current;
    if (!el || !dragRef.current.isDown) return;

    const { scrollLeft: newScrollLeft, hasDragged } = calculateDragScroll({
      startX: dragRef.current.startX,
      currentX: e.clientX,
      initialScrollLeft: dragRef.current.scrollLeft,
    });

    if (hasDragged) {
      if (!dragRef.current.hasDragged) {
        dragRef.current.hasDragged = true;
        setIsDragging(true);
      }
      el.scrollLeft = newScrollLeft;
      updateScrollState();
    }
  };

  const endDrag = () => {
    if (!dragRef.current.isDown) return;
    dragRef.current.isDown = false;
    if (dragRef.current.hasDragged) {
      // Hold suppression for a tick to cancel tile click
      setTimeout(() => {
        dragRef.current.hasDragged = false;
        setIsDragging(false);
      }, 50);
    } else {
      setIsDragging(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const tiles = Array.from(group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    const at = tiles.indexOf(document.activeElement as HTMLButtonElement);
    tiles[(at + step + tiles.length) % tiles.length]?.focus();
  };

  if (wrap) {
    return (
      <div
        ref={group}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-3 gap-y-4 p-2 -m-2"
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
              className="group shrink-0 space-y-1.5 text-center focus-visible:outline-none disabled:cursor-not-allowed w-full"
            >
              <span
                className={`relative block overflow-hidden rounded-xl bg-surface-2 transition-[transform,box-shadow] duration-200 ease-out group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand/60 ${s.frame} ${
                  on ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "ring-1 ring-line group-hover:ring-line-strong"
                } ${disabled && !on ? "opacity-50" : ""}`}
              >
                {o.src ? (
                  <TileImage o={o} px={s.px} />
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

  return (
    <div className="relative group/picker">
      {/* Left chevron & soft edge fade */}
      <div
        className={`pointer-events-none absolute -left-2 top-0 bottom-0 w-10 bg-gradient-to-r from-surface via-surface/80 to-transparent z-[5] transition-opacity duration-200 ${
          scrollState.canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll left"
        onClick={() => scrollByDirection(-1)}
        className={`absolute -left-2 top-[38%] -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-line transition-all duration-150 hover:bg-surface-2 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          scrollState.canScrollLeft
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Sideways ribbon with drag + wheel navigation */}
      <div
        ref={group}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className={`-mx-2 flex scroll-px-2 gap-3 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? "snap-none cursor-grabbing select-none" : "snap-x cursor-grab"
        }`}
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
              onClick={(e) => {
                if (dragRef.current.hasDragged) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (!on && onSelect) onSelect(o.id);
              }}
              className={`group shrink-0 snap-start space-y-1.5 text-center focus-visible:outline-none disabled:cursor-not-allowed ${s.tile}`}
            >
              <span
                className={`relative block overflow-hidden rounded-xl bg-surface-2 transition-[transform,box-shadow] duration-200 ease-out group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand/60 ${s.frame} ${
                  on ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "ring-1 ring-line group-hover:ring-line-strong"
                } ${disabled && !on ? "opacity-50" : ""}`}
              >
                {o.src ? (
                  <TileImage o={o} px={s.px} draggable={false} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand pointer-events-none">{o.icon}</span>
                )}
                {drawing && (
                  <span className="absolute inset-0 flex items-center justify-center bg-surface/60">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className={`block truncate text-[12px] leading-tight select-none ${on ? "font-medium text-ink" : "text-muted"}`}>{o.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right chevron & soft edge fade */}
      <div
        className={`pointer-events-none absolute -right-2 top-0 bottom-0 w-10 bg-gradient-to-l from-surface via-surface/80 to-transparent z-[5] transition-opacity duration-200 ${
          scrollState.canScrollRight ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Scroll right"
        onClick={() => scrollByDirection(1)}
        className={`absolute -right-2 top-[38%] -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-line transition-all duration-150 hover:bg-surface-2 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          scrollState.canScrollRight
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
