"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut
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
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  {
    name: "Idea Stream",
    href: "/ideas",
    icon: Sparkles,
    badge: "4 Ready",
    badgeColor: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  },
  {
    name: "Editorial Studio",
    href: "/drafts",
    icon: FileText,
    badge: "1 Review",
    badgeColor: "bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/20",
  },
  {
    name: "Brand & Visuals",
    href: "/brand",
    icon: Palette,
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
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerHarvest = async () => {
    setIsHarvesting(true);
    setNotification("Harvesting live signals from Google Trends & Reddit...");
    setTimeout(() => {
      setIsHarvesting(false);
      setNotification("✅ 2 New High-Signal HVAC & Voice AI Ideas Harvested!");
      setTimeout(() => setNotification(null), 5000);
    }, 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f6] text-[#12242a]">
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
                <span className="font-bold text-lg text-[#ff6b4a]">.AI</span>
              </div>
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono tracking-wide rounded bg-[#1f343d] text-teal-300 border border-[#2b4752]">
                OPS
              </span>
            </Link>
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <button
              onClick={triggerHarvest}
              disabled={isHarvesting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0e5c63] to-[#167a84] hover:from-[#116e76] hover:to-[#1a8e9b] text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-75 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isHarvesting ? "animate-spin" : ""}`} />
              <span>{isHarvesting ? "Harvesting Signals..." : "Trigger Idea Harvester"}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Agent Control
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-[#0e5c63] text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-[#1a313a]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#ff6b4a]" : "text-slate-400 group-hover:text-white"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        isActive ? "bg-white/20 text-white border-white/30" : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer & Active Fleet Telemetry */}
        <div className="p-4 border-t border-[#1f343d] space-y-3">
          <div className="p-3 rounded-xl bg-[#1a313a] border border-[#2b4752] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Fleet Operational</span>
              </div>
              <span className="font-mono text-slate-400">7 Workers</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>Avg Cost / Post:</span>
              <span className="text-white font-semibold">$0.038</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0e5c63] text-white font-bold text-xs flex items-center justify-center border border-[#167a84]">
                P
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-white">Parvej Shah</div>
                <div className="text-[10px] text-slate-400 font-mono">Admin / Lead</div>
              </div>
            </div>
            <a
              href="https://getminions.ai"
              target="_blank"
              rel="noreferrer"
              title="Open Public Site"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a313a] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT STAGE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP COMMAND HEADER */}
        <header className="h-16 px-8 border-b border-[#e5e7eb] bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ideas, drafts, agents, published links, or R2 assets (Press ⌘K)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#faf9f6] border border-[#e5e7eb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#faf9f6] border border-[#e5e7eb] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Cloudflare R2: Active</span>
            </div>

            {/* Notification Toast */}
            {notification && (
              <div className="px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium animate-fade-in shadow-sm">
                {notification}
              </div>
            )}

            {/* Live Publication Link */}
            <a
              href="https://getminions.ai/blog"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#faf9f6] text-[#0e5c63] hover:bg-teal-50 border border-[#e5e7eb] hover:border-teal-200 transition-all"
            >
              <span>Live Blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
