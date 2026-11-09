"use client";

import React, { useMemo } from "react";
import {
  Search,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { NavItem } from "@/constants/nav";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  navItems: NavItem[];
  onNavigate: (href: string) => void;
}

/**
 * ⌘K navigation palette.
 *
 * The previous version listed three hardcoded results — a specific draft id, a
 * fabricated live count, and a sample idea title — and never actually used the
 * text the user typed. It filters the real destinations now.
 */
export default function CommandPalette({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  navItems,
  onNavigate,
}: CommandPaletteProps) {
  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [navItems, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      hideCloseButton
      closeOnBackdrop
    >
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
        <Search className="w-5 h-5 text-brand" />
        <input
          type="text"
          placeholder="Search sections…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="flex-1 bg-transparent border-0 text-sm text-ink focus:outline-none placeholder:text-subtle"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-muted hover:text-ink px-2 py-1 rounded bg-surface-2 border border-line cursor-pointer"
        >
          ESC
        </button>
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto space-y-1">
        {results.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-subtle">
            No sections match “{searchQuery}”.
          </div>
        ) : (
          results.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => onNavigate(item.href)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-2 flex items-center justify-between text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-brand" />
                  <span className="font-semibold text-ink">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] text-subtle group-hover:text-brand">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
