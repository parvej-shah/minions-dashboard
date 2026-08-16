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
  AlertTriangle
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Mission Control",
    href: "/",
    icon: LayoutDashboard,
    badge: "Live",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    name: "Idea Stream",
    href: "/ideas",
    icon: Sparkles,
    badge: "4 Ready",
    badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  },
  {
    name: "Editorial Studio",
    href: "/drafts",
    icon: FileText,
    badge: "1 Review",
    badgeColor: "bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/20",
  },
  {
    name: "Brand & Directives",
    href: "/brand",
    icon: Palette,
    badge: "12 Directives",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
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
    badge: "7 Online",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Command palette state
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
      if (e.key === "Escape") {
        setShowPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerHarvest = async () => {
    setIsHarvesting(true);
    setNotification("Harvesting live signals from Google Trends, Reddit & HVAC trade forums...");
    setTimeout(() => {
      setIsHarvesting(false);
      setNotification("✅ 2 New High-Signal HVAC & Voice AI Ideas Harvested into Stream!");
      setTimeout(() => setNotification(null), 5000);
    }, 2000);
  };

  const quickNav = (url: string) => {
    setShowPalette(false);
    setSearchQuery("");
    router.push(url);
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f6] text-[#12242a]">
      {/* COMMAND PALETTE MODAL */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
          <div className="bg-[#12242a] text-white w-full max-w-2xl rounded-2xl border border-border/40 shadow-2xl overflow-hidden space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
              <Search className="w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Search drafts, ideas, brand directives, or agent fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-0 text-sm font-sans text-white focus:outline-none placeholder:text-muted-foreground"
              />
              <button 
                onClick={() => setShowPalette(false)}
                className="text-xs font-mono text-muted-foreground hover:text-white px-2 py-1 rounded bg-card/60"
              >
                ESC
              </button>
            </div>

            <div className="p-3 max-h-[400px] overflow-y-auto space-y-4">
              {/* Drafts Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase px-3">
                  Drafts & Reviewer
                </div>
                <button
                  onClick={() => quickNav("/drafts/ASSET-0003")}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-white">Raw JSON Over Agent Summaries</div>
                      <div className="text-[11px] text-muted-foreground">ASSET-0003 • PEER Engineering • Published</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                <button
                  onClick={() => quickNav("/drafts/ASSET-0004")}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">The $3,800 Attic Saturation Leak</div>
                      <div className="text-[11px] text-muted-foreground">ASSET-0004 • ICP Operations • Pending Review</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Brand Directives Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase px-3">
                  Brand Guidelines (Google Sheet Tab)
                </div>
                <button
                  onClick={() => quickNav("/brand")}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Sheet Directives & Tone Rules</div>
                      <div className="text-[11px] text-muted-foreground">12 Active Rules • Banned Lexicon • Proof Standards</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Fleet Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase px-3">
                  Autonomous Agent Fleet
                </div>
                <button
                  onClick={() => quickNav("/fleet")}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Agent Fleet Manager</div>
                      <div className="text-[11px] text-muted-foreground">Rex, Pip, Zip, Strategist, Writer, Editor (7 Online)</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-[#e5e7eb] bg-[#12242a] flex flex-col justify-between shrink-0 shadow-sm text-white">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-[#1f343d] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0e5c63] to-[#ff6b4a] flex items-center justify-center font-bold text-white shadow-md text-sm">
                M
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold text-lg tracking-tight text-white">Minions</span>
                <span className="text-[#ff6b4a] font-mono text-sm ml-0.5 font-bold">.AI</span>
              </div>
            </Link>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0e5c63]/40 text-[#4fd1c5] border border-[#0e5c63]/60 font-semibold tracking-wide">
              OPS
            </span>
          </div>

          {/* Quick Trigger Button */}
          <div className="p-4">
            <button
              onClick={triggerHarvest}
              disabled={isHarvesting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0e5c63] to-[#128a96] hover:opacity-95 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isHarvesting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Harvesting Signals...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-[#ff6b4a]" />
                  <span>Trigger Idea Harvester</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-1">
            <div className="px-3 py-1.5 text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
              Agent Control
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#0e5c63] text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1f343d] space-y-3">
          <div className="bg-[#0b171b] p-3 rounded-xl border border-[#1f343d] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Fleet Operational</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">7 Workers</span>
              <span className="text-white font-bold">100% Health</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-[#1f343d]/60 flex justify-between">
              <span>Avg Cost / Post:</span>
              <span className="text-[#ff6b4a] font-mono font-bold">$0.038</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0e5c63] text-white font-bold text-xs flex items-center justify-center border border-[#1f343d]">
                P
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white">Parvej Shah</div>
                <div className="text-[10px] text-slate-400">Admin / Lead</div>
              </div>
            </div>
            <a
              href="https://getminions.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white p-1"
              title="Open Public Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP APP HEADER */}
        <header className="h-16 border-b border-[#e5e7eb] bg-white px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setShowPalette(true)}
              className="w-full flex items-center justify-between bg-[#f3f4f6] hover:bg-[#eaecee] border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-xs text-[#6b7280] transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#9ca3af]" />
                <span>Search ideas, drafts, agents, published links, or R2 assets...</span>
              </div>
              <kbd className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#d1d5db] text-[#4b5563]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloudflare R2: Active</span>
            </div>

            <a
              href="https://getminions.ai/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#12242a] hover:bg-[#1f343d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <span>Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Global Toast Notification */}
        {notification && (
          <div className="bg-[#12242a] text-white px-6 py-2.5 border-b border-[#0e5c63] flex items-center justify-between text-xs animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff6b4a] animate-pulse" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
