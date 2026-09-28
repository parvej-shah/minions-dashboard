"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Search,
  Sparkles,
  ShieldAlert,
  X,
  Zap,
} from "lucide-react";
import { BLOG_BASE_URL } from "@/constants/config";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import type { NavItem } from "@/constants/nav";
import type { NavCounts } from "@/types";
import type { Session } from "next-auth";
import QuotaMeter from "./QuotaMeter";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export interface MobileNavProps {
  navItems: NavItem[];
  navCounts: NavCounts | null;
  pathname: string;
  session: Session | null;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenPalette: () => void;
  onOpenAuthModal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isHarvesting?: boolean;
  onHarvest?: () => void;
  /** Whether this tenant has the blog channel switched on. Undefined means
   *  "not loaded yet"; defaults to true so the blog links don't flash away. */
  blogEnabled?: boolean;
}

/** The slide-over drawer, the compact top bar, and the fixed bottom tab bar. */
export function MobileDrawer({
  navItems,
  navCounts,
  pathname,
  session,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenPalette,
  onOpenAuthModal,
  onSignIn,
  onSignOut,
  isHarvesting = false,
  onHarvest,
  blogEnabled = true,
}: MobileNavProps) {
  const { brandSettings } = useBrandSettings();
  const liveBlogUrl = brandSettings?.company_domain
    ? (brandSettings.company_domain.startsWith("http") ? brandSettings.company_domain : `https://${brandSettings.company_domain}`)
    : BLOG_BASE_URL;
  // A signed-in workspace without its own domain has no public blog; the
  // fallback would send it to the Minions blog, where its posts do not exist.
  const hasOwnBlog = !brandSettings || Boolean(brandSettings.company_domain);

  return (
    <>
  {mobileMenuOpen && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex animate-in fade-in duration-200">
      <div className="w-4/5 max-w-sm bg-[#0f1419] h-full p-5 flex flex-col justify-between border-r border-[#1f2b37] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2b37]">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-baseline">
              <span className="font-extrabold text-xl tracking-tight text-white">Minions</span>
              <span className="text-[#ff6b4a] font-bold text-xl ml-0.5">.AI</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {session && <WorkspaceSwitcher />}

          {navCounts && <QuotaMeter quota={navCounts.quota} />}

          {/* Mobile Search */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPalette();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] text-xs text-[#64748B]"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#00C9A7]" />
              <span>Search ideas, drafts...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#0b0f14] border border-[#1f2b37] rounded text-[#94A3B8]">
              ⌘K
            </kbd>
          </button>

          {/* QUICK TRIGGER BUTTON */}
          {onHarvest && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onHarvest();
              }}
              disabled={isHarvesting}
              className="w-full flex items-center justify-center gap-2 bg-[#ff6b4a] hover:bg-[#ff522b] text-white text-xs font-bold py-3 px-3 rounded-xl shadow-lg shadow-[#ff6b4a]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isHarvesting ? "animate-spin" : ""}`} />
              <span>{isHarvesting ? "Harvesting Signals..." : "Trigger Idea Harvester"}</span>
            </button>
          )}

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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#161d24] text-[#00C9A7] border-l-2 border-[#00C9A7]"
                      : "text-[#94A3B8] hover:bg-[#161d24]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#00C9A7]" : "text-[#64748B]"}`} />
                    <span className="truncate whitespace-nowrap">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                      isActive
                        ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                        : item.badgeColor || "bg-[#161d24] text-[#94A3B8] border border-[#1f2b37]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#1f2b37]">
          {session?.user?.role === "SYSTEM_ADMIN" && (
            <Link
              href="/platform-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-400"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Platform Admin</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                SaaS ↗
              </span>
            </Link>
          )}

          {blogEnabled && hasOwnBlog && (
            <a
              href={liveBlogUrl === BLOG_BASE_URL ? `${liveBlogUrl}/blog` : liveBlogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#ff6b4a] text-white text-xs font-bold shadow-sm"
            >
              <span>View Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}

          {session ? (
            <div className="w-full p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="flex items-center gap-2 min-w-0 flex-1 text-left"
              >
                {session.user?.image ? (
                  <Image src={session.user.image} alt={session.user.name || "User"} width={24} height={24} unoptimized className="w-6 h-6 rounded-full border border-[#00C9A7]/40 shrink-0 object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] font-bold text-xs flex items-center justify-center shrink-0">
                    {session.user?.name ? session.user.name[0].toUpperCase() : "A"}
                  </div>
                )}
                <span className="text-white font-mono text-[11px] truncate">{session.user?.email}</span>
              </button>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => onSignOut()}
                  className="p-1 text-[#64748B] hover:text-[#ff6b4a]"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSignIn()}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 border border-[#00C9A7]/30 text-xs font-bold text-[#00C9A7]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )}
    </>
  );
}

export function MobileTopBar({
  onOpenPalette,
  setMobileMenuOpen,
  navCounts,
  isHarvesting = false,
  onHarvest,
  blogEnabled = true,
}: Pick<MobileNavProps, "onOpenPalette" | "setMobileMenuOpen" | "navCounts" | "blogEnabled"> & {
  isHarvesting?: boolean;
  onHarvest?: () => void;
}) {
  const { brandSettings } = useBrandSettings();
  const liveBlogUrl = brandSettings?.company_domain
    ? (brandSettings.company_domain.startsWith("http") ? brandSettings.company_domain : `https://${brandSettings.company_domain}`)
    : BLOG_BASE_URL;
  // A signed-in workspace without its own domain has no public blog; the
  // fallback would send it to the Minions blog, where its posts do not exist.
  const hasOwnBlog = !brandSettings || Boolean(brandSettings.company_domain);

  return (
  <header className="h-14 border-b border-[#1f2b37] bg-[#0f1419]/95 backdrop-blur-md px-3.5 sm:px-4 flex items-center justify-between sticky top-0 z-30 md:hidden">
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37] shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      <Link href="/" className="flex items-baseline shrink-0">
        <span className="font-extrabold text-base tracking-tight text-white">Minions</span>
        <span className="text-[#ff6b4a] font-bold text-base ml-0.5">.AI</span>
      </Link>
    </div>

    <div className="flex items-center gap-1.5 sm:gap-2">
      {navCounts && <QuotaMeter quota={navCounts.quota} compact />}

      {onHarvest && (
        <button
          onClick={onHarvest}
          disabled={isHarvesting}
          className="p-2 rounded-xl bg-[#ff6b4a]/10 hover:bg-[#ff6b4a]/20 text-[#ff6b4a] border border-[#ff6b4a]/30 transition-all disabled:opacity-50 shrink-0"
          title="Trigger Idea Harvester"
          aria-label="Trigger Idea Harvester"
        >
          <Zap className={`w-4 h-4 ${isHarvesting ? "animate-spin" : ""}`} />
        </button>
      )}

      <button
        onClick={() => onOpenPalette()}
        className="p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37] shrink-0"
        title="Search"
        aria-label="Search"
      >
        <Search className="w-4 h-4 text-[#00C9A7]" />
      </button>

      {blogEnabled && hasOwnBlog && (
        <a
          href={liveBlogUrl === BLOG_BASE_URL ? `${liveBlogUrl}/blog` : liveBlogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-white bg-[#ff6b4a] px-2.5 py-1.5 rounded-lg shadow-sm"
        >
          <span>Blog</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      )}
    </div>
  </header>
  );
}

export function MobileBottomNav({
  pathname,
  navCounts,
  setMobileMenuOpen,
}: Pick<MobileNavProps, "pathname" | "navCounts" | "setMobileMenuOpen">) {
  return (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f1419]/95 backdrop-blur-xl border-t border-[#1f2b37] px-1 py-1.5 flex items-center justify-between pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black">
    <Link
      href="/"
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
        pathname === "/"
          ? "text-[#00C9A7] font-bold"
          : "text-[#94A3B8] hover:text-white"
      }`}
    >
      <LayoutDashboard className="w-5 h-5" />
      <span className="text-[10px] font-medium">Mission</span>
    </Link>

    <Link
      href="/ideas"
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all relative ${
        pathname.startsWith("/ideas")
          ? "text-[#00C9A7] font-bold"
          : "text-[#94A3B8] hover:text-white"
      }`}
    >
      <Sparkles className="w-5 h-5" />
      <span className="text-[10px] font-medium">Ideas</span>
      {navCounts && navCounts.ideasReady > 0 && (
        <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
      )}
    </Link>

    <Link
      href="/editorial"
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all relative ${
        pathname.startsWith("/editorial") || pathname.startsWith("/drafts")
          ? "text-[#ff6b4a] font-bold"
          : "text-[#94A3B8] hover:text-white"
      }`}
    >
      <FileText className="w-5 h-5" />
      <span className="text-[10px] font-medium">Editorial</span>
      {navCounts && navCounts.pendingReview > 0 && (
        <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#ff6b4a]" />
      )}
    </Link>

    <Link
      href="/published"
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
        pathname.startsWith("/published")
          ? "text-[#3B82F6] font-bold"
          : "text-[#94A3B8] hover:text-white"
      }`}
    >
      <Globe className="w-5 h-5" />
      <span className="text-[10px] font-medium">Live</span>
    </Link>

    <button
      onClick={() => setMobileMenuOpen(true)}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[#94A3B8] hover:text-white transition-all cursor-pointer"
    >
      <Menu className="w-5 h-5" />
      <span className="text-[10px] font-medium">Menu</span>
    </button>
  </nav>
  );
}
