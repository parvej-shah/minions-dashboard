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
  Globe
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
    badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
  },
  {
    name: "Idea Stream",
    href: "/ideas",
    icon: Sparkles,
    badge: "4 Ready",
    badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
  },
  {
    name: "Editorial Studio",
    href: "/editorial",
    icon: FileText,
    badge: "1 Review",
    badgeColor: "bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/30",
  },
  {
    name: "Published Posts",
    href: "/published",
    icon: Globe,
    badge: "4 Live",
    badgeColor: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  },
  {
    name: "Brand & Directives",
    href: "/brand",
    icon: Palette,
    badge: "12 Directives",
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
    badge: "7 Online",
    badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
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

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
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
    <div className="flex min-h-screen bg-[#070B0F] text-[#F1F5F9]">
      {/* COMMAND PALETTE MODAL */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
          <div className="bg-[#0F1419] text-[#F1F5F9] w-full max-w-2xl rounded-2xl border border-[#1F2D3D] shadow-2xl overflow-hidden space-y-3">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1F2D3D]">
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
                className="text-[10px] font-mono text-[#94A3B8] hover:text-white px-2 py-1 rounded bg-[#161D26] border border-[#1F2D3D]"
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
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161D26] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#00C9A7]" />
                    <span className="font-semibold text-[#F1F5F9]">Raw JSON Over Agent Summaries</span>
                    <span className="text-[10px] font-mono bg-[#00C9A7]/10 text-[#00C9A7] px-1.5 py-0.5 rounded">ASSET-0003</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] group-hover:text-[#00C9A7]">Review & Publish →</span>
                </button>
              </div>

              {/* Published Posts Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#64748B] uppercase px-3">
                  Published Broadcasts
                </div>
                <button
                  onClick={() => quickNav("/published")}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161D26] flex items-center justify-between text-xs transition-colors group"
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
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#161D26] flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#ff6b4a]" />
                    <span className="font-semibold text-[#F1F5F9]">High-Temperature Attic Condenser Failures (HVAC)</span>
                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">ICP</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] group-hover:text-[#ff6b4a]">Claim & Draft →</span>
                </button>
              </div>

              {/* Quick Navigation Links */}
              <div className="space-y-1 pt-2 border-t border-[#1F2D3D]">
                <div className="text-[10px] font-mono text-[#64748B] uppercase px-3">
                  Navigation
                </div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  <button onClick={() => quickNav("/")} className="text-left px-2.5 py-1.5 rounded-lg hover:bg-[#161D26] text-xs text-[#94A3B8] hover:text-white">
                    ⇥ Mission Control
                  </button>
                  <button onClick={() => quickNav("/brand")} className="text-left px-2.5 py-1.5 rounded-lg hover:bg-[#161D26] text-xs text-[#94A3B8] hover:text-white">
                    ⇥ Brand & Visual Studio
                  </button>
                  <button onClick={() => quickNav("/fleet")} className="text-left px-2.5 py-1.5 rounded-lg hover:bg-[#161D26] text-xs text-[#94A3B8] hover:text-white">
                    ⇥ Agent Fleet (7 Workers)
                  </button>
                  <button onClick={() => quickNav("/telemetry")} className="text-left px-2.5 py-1.5 rounded-lg hover:bg-[#161D26] text-xs text-[#94A3B8] hover:text-white">
                    ⇥ Cost & Telemetry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0F1419] border-r border-[#1F2D3D] flex flex-col justify-between p-4 shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* LOGO & SYSTEM BADGE */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2D3D]">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00C9A7] to-[#0e5c63] flex items-center justify-center font-black text-[#070B0F] text-sm shadow-md group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex items-baseline">
                <span className="font-bold text-base tracking-tight text-[#F1F5F9]">Minions</span>
                <span className="text-[#00C9A7] font-mono text-sm font-semibold ml-0.5">.AI</span>
              </div>
            </Link>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#161D26] text-[#00C9A7] border border-[#1F2D3D]">
              COCKPIT
            </span>
          </div>

          {/* QUICK TRIGGER BUTTON */}
          <button
            onClick={triggerHarvest}
            disabled={isHarvesting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00C9A7] to-[#00A88A] text-[#070B0F] hover:opacity-95 text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-[#00C9A7]/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isHarvesting ? "animate-spin" : ""}`} />
            <span>{isHarvesting ? "Harvesting Signals..." : "Trigger Idea Harvester"}</span>
          </button>

          {/* NAVIGATION LINKS */}
          <div className="space-y-1">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#161D26] text-[#00C9A7] font-bold border-l-2 border-[#00C9A7] shadow-xs"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#00C9A7]" : "text-[#64748B]"}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-[#00C9A7]/20 text-[#00C9A7] border-[#00C9A7]/40"
                          : item.badgeColor || "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D]"
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

        {/* SIDEBAR FOOTER (PERSISTENT AMBIENT STATUS) */}
        <div className="pt-4 border-t border-[#1F2D3D] space-y-3">
          <div className="p-3 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8] font-mono">Fleet Operational</span>
              <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-ping" />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#F1F5F9]">
              <span>7 Workers</span>
              <span className="text-[#00C9A7]">100% Health</span>
            </div>
            <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-between pt-1 border-t border-[#1F2D3D]">
              <span>Avg Cost / Post:</span>
              <span className="text-[#00C9A7] font-semibold">$0.038</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1 text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] font-bold text-xs flex items-center justify-center border border-[#00C9A7]/40">
                P
              </div>
              <div className="text-[11px] leading-tight">
                <div className="font-semibold text-[#F1F5F9]">Parvej Shah</div>
                <div className="text-[10px] text-[#64748B]">Admin / Lead</div>
              </div>
            </div>

            <a
              href="https://getminions.ai"
              target="_blank"
              rel="noreferrer"
              className="text-[#64748B] hover:text-[#00C9A7] transition-colors"
              title="Open Public Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070B0F]">
        {/* TOPBAR */}
        <header className="h-16 border-b border-[#1F2D3D] bg-[#0F1419]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setShowPalette(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#161D26] border border-[#1F2D3D] text-xs text-[#64748B] hover:border-[#00C9A7]/50 hover:text-[#94A3B8] transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span>Search ideas, drafts, agents, published links, or R2 assets...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#070B0F] border border-[#1F2D3D] rounded text-[#94A3B8]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D26] border border-[#1F2D3D] text-[11px] font-mono text-[#94A3B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
              <span>Cloudflare R2: Active</span>
            </div>

            <a
              href="https://getminions.ai/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#070B0F] bg-[#00C9A7] hover:bg-[#00A88A] px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
            >
              <span>Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="bg-[#00C9A7]/20 border-b border-[#00C9A7]/40 px-6 py-2 text-xs font-medium text-[#00C9A7] flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PAGE BODY */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
