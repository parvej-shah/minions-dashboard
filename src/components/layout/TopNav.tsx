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
    <span className="min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-semibold leading-5 text-white" aria-label={`${count} waiting for you`}>
      {count}
    </span>
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

/** Phone tab bar: the same four places, fixed to the bottom. */
export function BottomTabs({ navItems, navCounts, pathname }: Omit<TopNavProps, "account">) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const active = isNavActive(item, pathname);
          const Icon = item.icon;
          const count = badgeFor(item, navCounts);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${active ? "font-medium text-brand" : "text-muted"}`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                {count > 0 && (
                  <span className="absolute -right-2.5 -top-1 min-w-4 rounded-full bg-coral px-1 text-center text-[11px] font-semibold leading-4 text-white">
                    {count}
                  </span>
                )}
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
