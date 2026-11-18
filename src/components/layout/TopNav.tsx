"use client";

import React from "react";
import Link from "next/link";
import { isNavActive, type NavItem } from "@/constants/nav";
import type { NavCounts } from "@/types";

export interface TopNavProps {
  navItems: NavItem[];
  navCounts: NavCounts | null;
  pathname: string;
  /** The avatar and its menu, on the right. */
  account: React.ReactNode;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-brand"
      aria-label="New post ready"
      title="New post ready"
    />
  );
}

function badgeFor(item: NavItem, counts: NavCounts | null) {
  return item.badge && counts ? counts[item.badge] : 0;
}

/** The thin top bar: name on the left, the four places in the middle, the avatar on the right. */
export function TopNav({ navItems, navCounts, pathname, account }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-[17px] font-bold tracking-tight text-ink">
          Minions
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isNavActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[15px] transition-colors ${
                  active ? "bg-surface font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-muted hover:text-ink"
                }`}
              >
                {item.name}
                <Badge count={badgeFor(item, navCounts)} />
              </Link>
            );
          })}
        </nav>
        {account}
      </div>
    </header>
  );
}

/**
 * Phone tab bar: a floating glass dock with three equal tabs (Today · Posts · Brand).
 * One soft pill slides under the active tab; labels stay visible so every place is named.
 */
export function BottomTabs({ navItems, navCounts, pathname }: Omit<TopNavProps, "account">) {
  const activeIndex = navItems.findIndex((item) => isNavActive(item, pathname));

  return (
    <nav
      aria-label="Main"
      data-dock="mobile"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        className="pointer-events-auto relative mx-auto grid max-w-[22rem] rounded-[26px] border border-line/70 bg-surface/80 p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_28px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-150"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {/* The one sliding pill. Hidden on pages that live under the avatar menu. */}
        <span
          aria-hidden="true"
          className={`absolute inset-y-1.5 left-1.5 rounded-[20px] bg-surface-3/80 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
            activeIndex < 0 ? "opacity-0" : "opacity-100"
          }`}
          style={{
            width: `calc((100% - 0.75rem) / ${navItems.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {navItems.map((item, index) => {
          const active = index === activeIndex;
          const Icon = item.icon;
          const count = badgeFor(item, navCounts);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative z-10 flex min-h-[52px] touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-[20px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/60 [-webkit-tap-highlight-color:transparent] ${
                active ? "text-ink" : "text-subtle active:text-ink"
              }`}
            >
              <span className="relative flex items-center justify-center transition-transform duration-150 group-active:scale-90 motion-reduce:transition-none">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
                {count > 0 && (
                  <span
                    className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface"
                    aria-label="New post ready"
                  />
                )}
              </span>
              <span className={`text-[11px] tracking-tight ${active ? "font-semibold" : "font-medium"}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
