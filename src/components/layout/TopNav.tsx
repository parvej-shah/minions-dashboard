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

/** Phone tab bar: 3-tab layout (Today · Posts · Brand) with elevated hero Posts button in center. */
export function BottomTabs({ navItems, navCounts, pathname }: Omit<TopNavProps, "account">) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-canvas/92 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-2xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 items-end px-3">
        {navItems.map((item) => {
          const active = isNavActive(item, pathname);
          const Icon = item.icon;
          const count = badgeFor(item, navCounts);
          const isPosts = item.href === "/posts";

          if (isPosts) {
            return (
              <div key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative -translate-y-2.5 flex min-h-[58px] min-w-[76px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-1.5 transition-all duration-200 active:scale-95 touch-manipulation ${
                    active
                      ? "bg-brand text-white shadow-[0_6px_20px_rgba(0,113,227,0.38)] ring-2 ring-canvas/80"
                      : "border border-line/80 bg-surface text-ink shadow-[0_3px_12px_rgba(0,0,0,0.06)] hover:bg-surface-2"
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.9} aria-hidden="true" />
                    {count > 0 && (
                      <span
                        className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${
                          active ? "border-2 border-brand bg-white" : "bg-brand"
                        }`}
                        aria-label="New post ready"
                      />
                    )}
                  </span>
                  <span className="text-[12px] font-semibold tracking-tight">{item.name}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[50px] flex-col items-center justify-center gap-1 py-1 text-xs transition-colors active:scale-95 touch-manipulation ${
                active ? "font-semibold text-brand" : "text-muted hover:text-ink"
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
                {count > 0 && (
                  <span
                    className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand"
                    aria-label="New post ready"
                  />
                )}
              </span>
              <span className="text-[11px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
