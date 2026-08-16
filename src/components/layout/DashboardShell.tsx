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
import AdminAuthModal, { AdminUser } from "@/components/auth/AdminAuthModal";

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

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("minions_admin_session");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return {
      email: "parvejshahlabib007@gmail.com",
      name: "Parvej Shah",
      role: "MARKETING_DIRECTOR",
      authenticated_at: new Date().toISOString(),
      supabase_project: "kneafaxwkopodiausljf.supabase.co"
    };
  });

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
    setNotification("Harvesting live signals from Google Trends, Reddit & HVAC trade forums...");
    setTimeout(() => {
      setIsHarvesting(false);
      setNotification("✅ 2 New High-Signal HVAC & Voice AI Ideas Harvested into Stream!");
      setTimeout(() => setNotification(null), 5000);
    }, 2000);
  };

  const quickNav = (url: string) => {
    setShowPalette(false);
    setMobileMenuOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d12] text-[#F1F5F9]">
      {/* AUTHENTICATION MODAL */}
      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("minions_admin_session", JSON.stringify(user));
            } catch {}
          }
          setNotification(`Authenticated as ${user.email} (${user.role})`);
        }}
        onLogout={() => {
          setCurrentUser(null);
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("minions_admin_session");
            } catch {}
          }
          setNotification("Signed out of Minions.AI Cockpit");
        }}
      />

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
      <aside className="w-64 bg-[#0f1419] border-r border-[#1f2b37] flex-col justify-between p-4 shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* LOGO & SYSTEM BADGE (WHITE MINIONS + CORAL .AI) */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1f2b37]">
            <Link href="/" className="flex items-baseline group">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
                minions
              </span>
              <span className="text-[#ff6b4a] font-mono font-bold text-xl ml-0.5">
                .ai
              </span>
            </Link>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#161d24] hover:bg-[#1e2631] text-[#00C9A7] border border-[#1f2b37] flex items-center gap-1 transition-colors"
              title="Admin Authentication Console"
            >
              <Lock className="w-3 h-3 text-[#ff6b4a]" />
              <span>ADMIN</span>
            </button>
          </div>

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
                      ? "bg-[#161d24] text-[#00C9A7] font-bold border-l-2 border-[#00C9A7] shadow-xs"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161d24]"
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

        {/* SIDEBAR FOOTER (PERSISTENT AMBIENT STATUS) */}
        <div className="pt-4 border-t border-[#1f2b37] space-y-3">
          <div className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8] font-mono">Fleet Operational</span>
              <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-ping" />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#F1F5F9]">
              <span>7 Workers</span>
              <span className="text-[#00C9A7]">100% Health</span>
            </div>
            <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-between pt-1 border-t border-[#1f2b37]">
              <span>Avg Cost / Post:</span>
              <span className="text-[#00C9A7] font-semibold">$0.038</span>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center justify-between text-xs p-2 rounded-xl bg-[#161d24] hover:bg-[#1e2631] border border-[#1f2b37] text-[#94A3B8] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#ff6b4a]/20 text-[#ff6b4a] font-bold text-xs flex items-center justify-center border border-[#ff6b4a]/40">
                P
              </div>
              <div className="text-[11px] leading-tight text-left">
                <div className="font-semibold text-[#F1F5F9] truncate max-w-[120px]">{currentUser?.name || "Parvej Shah"}</div>
                <div className="text-[10px] text-[#64748B] font-mono truncate max-w-[120px]">{currentUser?.email || "parvejshahlabib007@gmail.com"}</div>
              </div>
            </div>

            <Lock className="w-3.5 h-3.5 text-[#ff6b4a]" />
          </button>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-[#0f1419] h-full p-5 flex flex-col justify-between border-r border-[#1f2b37]">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1f2b37]">
                <div className="flex items-baseline">
                  <span className="font-extrabold text-xl tracking-tight text-white">minions</span>
                  <span className="text-[#ff6b4a] font-mono font-bold text-xl ml-0.5">.ai</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => quickNav(item.href)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-[#161d24] text-[#00C9A7] border-l-2 border-[#00C9A7]"
                          : "text-[#94A3B8] hover:bg-[#161d24]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#1f2b37]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#ff6b4a]/20 text-[#ff6b4a] font-bold text-xs flex items-center justify-center">
                    {currentUser?.name ? currentUser.name[0] : "P"}
                  </div>
                  <span className="text-white font-mono text-[11px]">{currentUser?.email || "parvejshahlabib007@gmail.com"}</span>
                </div>
                <span className="text-[#00C9A7] font-semibold text-[10px]">Auth Gate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0d12] pb-16 md:pb-0">
        {/* TOPBAR (DESKTOP & MOBILE RESPONSIVE) */}
        <header className="h-16 border-b border-[#1f2b37] bg-[#0f1419]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile Hamburger & Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37]"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-baseline">
              <span className="font-extrabold text-base tracking-tight text-white">minions</span>
              <span className="text-[#ff6b4a] font-mono font-bold text-base ml-0.5">.ai</span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setShowPalette(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#161d24] border border-[#1f2b37] text-xs text-[#64748B] hover:border-[#00C9A7]/50 hover:text-[#94A3B8] transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span>Search ideas, drafts, agents, published links, or R2 assets...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#0b0f14] border border-[#1f2b37] rounded text-[#94A3B8]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowPalette(true)}
              className="md:hidden p-2 rounded-xl bg-[#161d24] text-[#94A3B8] hover:text-white border border-[#1f2b37]"
              title="Search"
            >
              <Search className="w-4 h-4 text-[#00C9A7]" />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#161d24] border border-[#1f2b37] text-[11px] font-mono text-[#94A3B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
              <span>R2: Active</span>
            </div>

            <a
              href="https://getminions.ai/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#ff6b4a] hover:bg-[#ff522b] px-3 sm:px-3.5 py-1.5 rounded-xl transition-all shadow-sm shadow-[#ff6b4a]/20"
            >
              <span>Live Blog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f1419]/95 backdrop-blur-lg border-t border-[#1f2b37] px-2 py-2 flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname === "/" ? "text-[#00C9A7]" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] font-medium">Mission</span>
        </Link>

        <Link
          href="/ideas"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname.startsWith("/ideas") ? "text-[#00C9A7]" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-medium">Ideas</span>
        </Link>

        <Link
          href="/editorial"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname.startsWith("/editorial") || pathname.startsWith("/drafts")
              ? "text-[#ff6b4a]"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-medium">Editorial</span>
        </Link>

        <Link
          href="/published"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname.startsWith("/published") ? "text-[#3B82F6]" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span className="text-[10px] font-medium">Published</span>
        </Link>

        <Link
          href="/brand"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            pathname.startsWith("/brand") ? "text-[#8B5CF6]" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span className="text-[10px] font-medium">Brand</span>
        </Link>
      </nav>
    </div>
  );
}
