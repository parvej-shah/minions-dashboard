"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Lock, LogOut, Search, Zap, ShieldAlert } from "lucide-react";
import { BLOG_BASE_URL } from "@/constants/config";
import type { NavItem } from "@/constants/nav";
import type { NavCounts } from "@/types";
import type { Session } from "next-auth";
import QuotaMeter from "./QuotaMeter";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export interface SidebarProps {
  navItems: NavItem[];
  navCounts: NavCounts | null;
  pathname: string;
  session: Session | null;
  isHarvesting: boolean;
  onHarvest: () => void;
  onOpenPalette: () => void;
  onOpenAuthModal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  /** Whether this tenant has the blog channel switched on — a LinkedIn-only
   *  tenant has nowhere for "View Live Blog" to send them. Undefined means
   *  "not loaded yet"; defaults to true so the button doesn't flash away. */
  blogEnabled?: boolean;
}

/** Desktop sidebar: branding, search trigger, harvest action, nav, and account. */
export default function Sidebar({
  navItems,
  navCounts,
  pathname,
  session,
  isHarvesting,
  onHarvest,
  onOpenPalette,
  onOpenAuthModal,
  onSignIn,
  onSignOut,
  blogEnabled = true,
}: SidebarProps) {
  const { brandSettings } = useBrandSettings();
  const liveBlogUrl = brandSettings?.company_domain
    ? (brandSettings.company_domain.startsWith("http") ? brandSettings.company_domain : `https://${brandSettings.company_domain}`)
    : BLOG_BASE_URL;
  const liveBlogHostname = liveBlogUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
  <aside className="w-72 lg:w-76 bg-[#0f1419] border-r border-[#1f2b37] flex flex-col justify-between p-4 shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto z-40">
    <div className="space-y-4">
      {/* LOGO (WHITE MINIONS + CORAL .AI) */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f2b37]">
        <Link href="/" className="flex items-baseline group">
          <span className="font-extrabold text-2xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
            Minions
          </span>
          <span className="text-[#ff6b4a] font-bold text-2xl ml-0.5">
            .AI
          </span>
        </Link>
      </div>

      {session && <WorkspaceSwitcher />}

      {navCounts && <QuotaMeter quota={navCounts.quota} />}

      {/* SEARCH BAR (INTEGRATED IN SIDEBAR) */}
      <button
        onClick={() => onOpenPalette()}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#161d24] border border-[#1f2b37] text-xs text-[#64748B] hover:border-[#00C9A7]/50 hover:text-[#94A3B8] transition-all cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
          <span className="truncate">Search ideas, drafts...</span>
        </div>
        <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#0b0f14] border border-[#1f2b37] rounded text-[#94A3B8] shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* QUICK TRIGGER BUTTON */}
      <button
        onClick={onHarvest}
        disabled={isHarvesting}
        className="w-full flex items-center justify-center gap-2 bg-[#ff6b4a] hover:bg-[#ff522b] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-[#ff6b4a]/20 transition-all cursor-pointer disabled:opacity-50"
      >
        <Zap className={`w-3.5 h-3.5 ${isHarvesting ? "animate-spin" : ""}`} />
        <span>{isHarvesting ? "Harvesting Signals..." : "Trigger Idea Harvester"}</span>
      </button>

      {/* NAVIGATION LINKS */}
      <div className="space-y-1 pt-1">
        <div className="text-[10px] font-mono font-bold tracking-wider text-[#64748B] uppercase px-3 mb-2">
          Agent Control
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all group ${
                isActive
                  ? "bg-[#161d24] text-[#00C9A7] border-l-2 border-[#00C9A7]"
                  : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161d24]/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#00C9A7]" : "text-[#64748B] group-hover:text-[#94A3B8]"}`} />
                <span className="truncate whitespace-nowrap">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                    isActive
                      ? "bg-[#00C9A7]/20 text-[#00C9A7] border-[#00C9A7]/40"
                      : item.badgeColor || "bg-[#161d24] text-[#94A3B8] border-[#1f2b37]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {session?.user?.role === "SYSTEM_ADMIN" && (
          <div className="pt-2">
            <Link
              href="/platform-admin"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-400 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span className="truncate">Platform Admin</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                SaaS ↗
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>

    {/* SIDEBAR FOOTER (LIVE BLOG BUTTON + CLEAN USER PROFILE) */}
    <div className="pt-3 border-t border-[#1f2b37] space-y-2.5">
      {blogEnabled && (
        <a
          href={liveBlogUrl === BLOG_BASE_URL ? `${liveBlogUrl}/blog` : liveBlogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#ff6b4a]/10 hover:bg-[#ff6b4a]/20 border border-[#ff6b4a]/30 hover:border-[#ff6b4a] text-xs font-bold text-[#ff6b4a] transition-all group shadow-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ArrowUpRight className="w-4 h-4 text-[#ff6b4a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="truncate">View Live Blog</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ff6b4a]/20 text-white">
            {liveBlogHostname} ↗
          </span>
        </a>
      )}

      {session ? (
        <div className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] text-[#94A3B8]">
          <button
            onClick={() => onOpenAuthModal()}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
            title="View Admin Auth Details"
          >
            {session.user?.image ? (
              <Image src={session.user.image} alt={session.user.name || "User"} width={28} height={28} unoptimized className="w-7 h-7 rounded-full border border-[#00C9A7]/40 shrink-0 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] font-bold text-xs flex items-center justify-center border border-[#00C9A7]/40 shrink-0">
                {session.user?.name ? session.user.name[0].toUpperCase() : (session.user?.email ? session.user.email[0].toUpperCase() : "A")}
              </div>
            )}
            <div className="text-[11px] leading-tight text-left min-w-0">
              <div className="font-semibold text-[#F1F5F9] truncate">{session.user?.name || "Admin"}</div>
              <div className="text-[10px] text-[#64748B] font-mono truncate">{session.user?.email}</div>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => onSignOut()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#ff6b4a] hover:bg-[#ff6b4a]/10 transition-colors cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onSignIn()}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 border border-[#00C9A7]/30 hover:border-[#00C9A7] text-xs font-bold text-[#00C9A7] transition-all cursor-pointer shadow-xs"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sign In with Google</span>
        </button>
      )}
    </div>
  </aside>
  );
}
