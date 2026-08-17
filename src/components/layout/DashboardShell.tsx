"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Palette,
  BarChart3,
  Bot,
  Layers,
  Settings,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Radio,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  LogOut,
  X,
  Send,
  BookOpen,
  AlertTriangle,
  Globe,
  Menu,
  Lock,
  User
} from "lucide-react";
// Auth types
export interface AdminUser {
  email: string;
  name: string;
  role: string;
  authenticated_at: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

interface NavCounts {
  ideasReady: number;
  pendingReview: number;
  publishedLive: number;
  directivesCount: number;
  activeAgents: number;
}

function buildNavItems(counts: NavCounts | null) {
  return [
    {
      name: "Mission Control",
      href: "/",
      icon: LayoutDashboard,
      badge: "Live",
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
    {
      name: "Idea Stream",
      href: "/ideas",
      icon: Sparkles,
      badge: counts ? `${counts.ideasReady} Ready` : undefined,
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
    {
      name: "Editorial Studio",
      href: "/editorial",
      icon: FileText,
      badge: counts ? `${counts.pendingReview} Review` : undefined,
      badgeColor: "bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/30",
    },
    {
      name: "Published Posts",
      href: "/published",
      icon: Globe,
      badge: counts ? `${counts.publishedLive} Live` : undefined,
      badgeColor: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
    },
    {
      name: "Brand & Directives",
      href: "/brand",
      icon: Palette,
      badge: counts ? `${counts.directivesCount} Directives` : undefined,
      badgeColor: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30",
    },
    {
      name: "Cost & Telemetry",
      href: "/telemetry",
      icon: BarChart3,
    },
    {
      name: "Agent Fleet",
      href: "/fleet",
      icon: Bot,
      badge: counts ? `${counts.activeAgents} Active` : undefined,
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
  ];
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real nav badge counts, fetched from the DB. null until loaded, so badges
  // stay hidden rather than showing a stale/fake number before data arrives.
  const [navCounts, setNavCounts] = useState<NavCounts | null>(null);

  useEffect(() => {
    async function loadNavCounts() {
      try {
        const [ideasRes, assetsRes, directivesRes, agentsRes] = await Promise.all([
          fetch("/api/ideas"),
          fetch("/api/assets"),
          fetch("/api/brand/directives"),
          fetch("/api/agents"),
        ]);
        const [ideas, assets, directives, agents] = await Promise.all([
          ideasRes.ok ? ideasRes.json() : [],
          assetsRes.ok ? assetsRes.json() : [],
          directivesRes.ok ? directivesRes.json() : [],
          agentsRes.ok ? agentsRes.json() : [],
        ]);

        setNavCounts({
          ideasReady: Array.isArray(ideas) ? ideas.filter((i: { status?: string }) => i.status === "HARVESTED" || i.status === "REFINED").length : 0,
          pendingReview: Array.isArray(assets) ? assets.filter((a: { status?: string }) => a.status === "PENDING_REVIEW").length : 0,
          publishedLive: Array.isArray(assets) ? assets.filter((a: { status?: string }) => a.status === "PUBLISHED").length : 0,
          directivesCount: Array.isArray(directives) ? directives.length : 0,
          activeAgents: Array.isArray(agents) ? agents.filter((a: { status?: string }) => a.status === "ACTIVE").length : (Array.isArray(agents) ? agents.length : 0),
        });
      } catch {
        // Leave navCounts null: badges stay hidden rather than lying
      }
    }
    loadNavCounts();
  }, []);

  const navItems = buildNavItems(navCounts);

  const currentUser: AdminUser = {
    email: "xpeedlab@gmail.com",
    name: "XpeedLab Admin",
    role: "MARKETING_DIRECTOR",
    authenticated_at: new Date().toISOString()
  };

  // Command palette state
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowPalette(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerHarvest = async () => {
    setIsHarvesting(true);
    setNotification("Dispatching n8n Autonomous Harvester (Google Trends, Reddit & HVAC Signals)...");
    try {
      const res = await fetch("/api/pipeline/harvest", { method: "POST" });
      const data = await res.json();
      setIsHarvesting(false);
      setNotification(data.message || "✅ 2 New High-Signal Signals Harvested into Stream!");
      setTimeout(() => setNotification(null), 6000);
    } catch (e: unknown) {
      setIsHarvesting(false);
      const message = e instanceof Error ? e.message : "Could not reach the harvester pipeline.";
      setNotification(`⚠️ Harvest request failed: ${message}`);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const quickNav = (url: string) => {
    setShowPalette(false);
    setMobileMenuOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d12] text-[#F1F5F9]">

      {/* COMMAND PALETTE MODAL */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
          <div className="bg-[#0f1419] text-[#F1F5F9] w-full max-w-2xl rounded-2xl border border-[#1f2b37] shadow-2xl overflow-hidden space-y-3">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1f2b37]">
              <Search className="w-5 h-5 text-[#00C9A7]" />
              <input
                type="text"
                placeholder="Search drafts, published posts, ideas, brand directives, or agent fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-0 text-sm text-[#F1F5F9] focus:outline-none placeholder:text-[#64748B]"
              />
              <button 
                onClick={() => setShowPalette(false)}
                className="text-[10px] font-mono text-[#94A3B8] hover:text-white px-2 py-1 rounded bg-[#161d24] border border-[#1f2b37]"
              >
                ESC
              </button>
            </div>

            <div className="p-3 max-h-[400px] overflow-y-auto space-y-4">
              {/* Drafts Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#64748B] uppercase px-3">
                  Drafts & Reviewer
                </div>
                <button
                  onClick={() => quickNav("/drafts/ASSET-0003")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161d24] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#ff6b4a]" />
                    <span className="font-semibold text-[#F1F5F9]">Raw JSON Over Agent Summaries</span>
                    <span className="text-[10px] font-mono bg-[#ff6b4a]/10 text-[#ff6b4a] px-1.5 py-0.5 rounded">ASSET-0003</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] group-hover:text-[#ff6b4a]">Review & Publish →</span>
                </button>
              </div>

              {/* Published Posts Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#64748B] uppercase px-3">
                  Published Broadcasts
                </div>
                <button
                  onClick={() => quickNav("/published")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161d24] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#3B82F6]" />
                    <span className="font-semibold text-[#F1F5F9]">View All Published Posts & Social Variants</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] group-hover:text-[#3B82F6]">4 Live →</span>
                </button>
              </div>

              {/* Ideas Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#64748B] uppercase px-3">
                  Idea Stream
                </div>
                <button
                  onClick={() => quickNav("/ideas")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161d24] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#00C9A7]" />
                    <span className="font-semibold text-[#F1F5F9]">High-Temperature Attic Condenser Failures (HVAC)</span>
                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">ICP</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] group-hover:text-[#00C9A7]">Claim & Draft →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
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

          {/* SEARCH BAR (INTEGRATED IN SIDEBAR) */}
          <button
            onClick={() => setShowPalette(true)}
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
            onClick={triggerHarvest}
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
          </div>
        </div>

        {/* SIDEBAR FOOTER (LIVE BLOG BUTTON + CLEAN USER PROFILE) */}
        <div className="pt-3 border-t border-[#1f2b37] space-y-2.5">
          <a
            href="https://www.getminions.ai/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#ff6b4a]/10 hover:bg-[#ff6b4a]/20 border border-[#ff6b4a]/30 hover:border-[#ff6b4a] text-xs font-bold text-[#ff6b4a] transition-all group shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ArrowUpRight className="w-4 h-4 text-[#ff6b4a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span className="truncate">View Live Blog</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ff6b4a]/20 text-white">
              getminions.ai ↗
            </span>
          </a>

          <div
            className="w-full flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] text-[#94A3B8]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] font-bold text-xs flex items-center justify-center border border-[#00C9A7]/40 shrink-0">
                X
              </div>
              <div className="text-[11px] leading-tight text-left min-w-0">
                <div className="font-semibold text-[#F1F5F9] truncate">XpeedLab Admin</div>
                <div className="text-[10px] text-[#64748B] font-mono truncate">xpeedlab@gmail.com</div>
              </div>
            </div>

            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20">ADMIN</span>
          </div>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-[#0f1419] h-full p-5 flex flex-col justify-between border-r border-[#1f2b37] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1f2b37]">
                <div className="flex items-baseline">
                  <span className="font-extrabold text-xl tracking-tight text-white">Minions</span>
                  <span className="text-[#ff6b4a] font-bold text-xl ml-0.5">.AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPalette(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#161d24] border border-[#1f2b37] text-xs text-[#64748B]"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>Search ideas, drafts...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#0b0f14] border border-[#1f2b37] rounded text-[#94A3B8]">
                  ⌘K
                </kbd>
              </button>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => quickNav(item.href)}
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
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#1f2b37]">
              <a
                href="https://www.getminions.ai/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#ff6b4a] text-white text-xs font-bold shadow-sm"
              >
                <span>View Live Blog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <div className="w-full p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] font-bold text-xs flex items-center justify-center shrink-0">
                    X
                  </div>
                  <span className="text-white font-mono text-[11px] truncate">xpeedlab@gmail.com</span>
                </div>
                <span className="text-[#00C9A7] font-semibold text-[10px] shrink-0 ml-2">ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0d12] pb-20 md:pb-0">
        {/* MOBILE HEADER ONLY (DESKTOP USES CLEAN FULL-HEIGHT SIDEBAR) */}
        <header className="h-14 border-b border-[#1f2b37] bg-[#0f1419]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37]"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-baseline">
              <span className="font-extrabold text-base tracking-tight text-white">Minions</span>
              <span className="text-[#ff6b4a] font-bold text-base ml-0.5">.AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPalette(true)}
              className="p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37]"
              title="Search"
            >
              <Search className="w-4 h-4 text-[#00C9A7]" />
            </button>

            <a
              href="https://getminions.ai/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-white bg-[#ff6b4a] px-2.5 py-1.5 rounded-lg"
            >
              <span>Blog</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="bg-[#00C9A7]/20 border-b border-[#00C9A7]/40 px-4 sm:px-6 py-2 text-xs font-medium text-[#00C9A7] flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PAGE BODY */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* MOBILE-FIRST FIXED BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f1419]/95 backdrop-blur-lg border-t border-[#1f2b37] px-2 py-1.5 flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname === "/"
              ? "bg-[#161d24] text-[#00C9A7] font-bold"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] font-medium">Mission</span>
        </Link>

        <Link
          href="/ideas"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname.startsWith("/ideas")
              ? "bg-[#161d24] text-[#00C9A7] font-bold"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium">Ideas</span>
        </Link>

        <Link
          href="/editorial"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname.startsWith("/editorial") || pathname.startsWith("/drafts")
              ? "bg-[#161d24] text-[#ff6b4a] font-bold"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-medium">Editorial</span>
        </Link>

        <Link
          href="/published"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname.startsWith("/published")
              ? "bg-[#161d24] text-[#00C9A7] font-bold"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-[10px] font-medium">Published</span>
        </Link>

        <Link
          href="/brand"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            pathname.startsWith("/brand")
              ? "bg-[#161d24] text-[#00C9A7] font-bold"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span className="text-[10px] font-medium">Brand</span>
        </Link>
      </nav>
    </div>
  );
}
