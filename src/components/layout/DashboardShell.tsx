"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { X } from "lucide-react";
import AdminAuthModal from "@/components/auth/AdminAuthModal";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";
import { MobileBottomNav, MobileDrawer, MobileTopBar } from "./MobileNav";
import { useNavCounts } from "@/hooks/useNavCounts";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { buildNavItems } from "@/constants/nav";
import type { PipelineTriggerResult } from "@/types";
import HarvestingProgressHUD, { HarvestingJob } from "@/components/common/HarvestingProgressHUD";
import ImpersonationBanner from "./ImpersonationBanner";

export interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Dashboard chrome: sidebar, mobile navigation, command palette, and the
 * harvest trigger.
 *
 * Every hook runs unconditionally. The login branch used to sit above the
 * hooks, so navigating to or from /login changed the hook count between
 * renders — React's documented crash condition. The login route now gets its
 * own layout instead of an early return here.
 */
export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [isHarvesting, setIsHarvesting] = useState(false);
  const [activeHarvestJob, setActiveHarvestJob] = useState<HarvestingJob | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navCounts = useNavCounts();
  const navItems = buildNavItems(navCounts);
  const channels = useChannelSummary();
  const blogEnabled = channels?.blog ?? true;
  const { message: notification, show: notify, clear: clearNotification } = useToast(6000);

  const triggerHarvest = useCallback(async () => {
    setIsHarvesting(true);
    const startedAt = Date.now();

    try {
      const result = await apiClient.post<PipelineTriggerResult & { run_id: string }>("/api/pipeline/harvest");
      if (!result.success) {
        throw new Error(result.message || "Failed to start harvester");
      }
      setActiveHarvestJob({ startedAt, runId: result.run_id });
    } catch (error) {
      notify(`⚠️ Harvest request failed: ${toErrorMessage(error, "Could not reach the harvester pipeline.")}`);
      setActiveHarvestJob(null);
    } finally {
      setIsHarvesting(false);
    }
  }, [notify]);

  const quickNav = useCallback(
    (url: string) => {
      setShowPalette(false);
      setMobileMenuOpen(false);
      setSearchQuery("");
      router.push(url);
    },
    [router]
  );

  // If a signed-in user has no tenant attached yet, direct them to onboarding setup
  React.useEffect(() => {
    if (session?.user && !session.user.clientId && !pathname.startsWith("/onboarding")) {
      router.replace("/onboarding/setup");
    }
  }, [session, pathname, router]);

  // Keyboard shortcut: ⌘K opens the palette, Escape closes overlays.
  React.useEffect(() => {
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

  const handleSignIn = useCallback(() => signIn("google", { callbackUrl: "/" }), []);
  const handleSignOut = useCallback(() => signOut({ callbackUrl: "/" }), []);

  const mobileNavProps = {
    navItems,
    navCounts,
    pathname,
    session,
    mobileMenuOpen,
    setMobileMenuOpen,
    onOpenPalette: () => setShowPalette(true),
    onOpenAuthModal: () => setAuthModalOpen(true),
    onSignIn: handleSignIn,
    onSignOut: handleSignOut,
    blogEnabled,
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d12] text-[#F1F5F9]">
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navItems={navItems}
        onNavigate={quickNav}
      />

      <Sidebar
        navItems={navItems}
        navCounts={navCounts}
        pathname={pathname}
        session={session}
        isHarvesting={isHarvesting}
        onHarvest={triggerHarvest}
        onOpenPalette={() => setShowPalette(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        blogEnabled={blogEnabled}
      />

      <MobileDrawer {...mobileNavProps} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />
        <MobileTopBar
          onOpenPalette={() => setShowPalette(true)}
          setMobileMenuOpen={setMobileMenuOpen}
          navCounts={navCounts}
        />

        {notification && (
          <div className="bg-[#00C9A7]/20 border-b border-[#00C9A7]/40 px-4 sm:px-6 py-2 text-xs font-medium text-[#00C9A7] flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{notification}</span>
            <button onClick={clearNotification} className="hover:opacity-75 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="p-3.5 pb-28 sm:p-6 md:p-8 md:pb-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav
        pathname={pathname}
        navCounts={navCounts}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <HarvestingProgressHUD 
        job={activeHarvestJob} 
        onDismiss={() => setActiveHarvestJob(null)} 
      />

      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={
          session?.user
            ? {
                email: session.user.email ?? "",
                name: session.user.name ?? "Admin",
                role: session.user.role,
                authenticated_at: new Date().toISOString(),
              }
            : null
        }
        onLogin={() => setAuthModalOpen(false)}
        onLogout={() => {
          setAuthModalOpen(false);
          handleSignOut();
        }}
      />
    </div>
  );
}
