"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { X } from "lucide-react";
import AdminAuthModal from "@/components/auth/AdminAuthModal";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";
import { MobileBottomNav, MobileDrawer, MobileTopBar } from "./MobileNav";
import { useNavCounts } from "@/hooks/useNavCounts";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { buildNavItems } from "@/constants/nav";
import type { PipelineTriggerResult } from "@/types";
import HarvestingProgressHUD, { HarvestingJob } from "@/components/common/HarvestingProgressHUD";
import ImpersonationBanner from "./ImpersonationBanner";
import { PageSkeleton } from "@/components/ui/Skeleton";

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
  const { data: session, status } = useSession();

  // A new signup has no workspace until onboarding saves its first step. If
  // they leave onboarding (or open "/" directly) every page here would fail
  // with "not attached to a tenant", so send them back to finish it. The
  // session is read fresh from the database (see the jwt callback), so this
  // never bounces someone whose workspace was just created. Staff are exempt:
  // they work through platform-admin and view-as-tenant.
  const needsWorkspace =
    status === "authenticated" && !!session?.user && !session.user.clientId && session.user.role !== "SYSTEM_ADMIN";
  React.useEffect(() => {
    if (needsWorkspace) router.replace("/onboarding/setup");
  }, [needsWorkspace, router]);

  const [isHarvesting, setIsHarvesting] = useState(false);
  const [activeHarvestJob, setActiveHarvestJob] = useState<HarvestingJob | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navCounts = useNavCounts();
  const navItems = buildNavItems();
  const channels = useChannelSummary();
  const { brandSettings, isLoading: brandLoading } = useBrandSettings();
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

  // A workspace whose brand brief was never finished belongs in the wizard.
  const needsBrief = !brandLoading && !!brandSettings && !brandSettings.positioning && pathname === "/";
  // While either redirect is pending, show a skeleton rather than a flash of an empty dashboard.
  const redirecting = needsWorkspace || needsBrief;

  // Handle onboarding success toast and un-onboarded tenant routing
  React.useEffect(() => {
    if (needsBrief) {
      router.replace("/onboarding/setup");
      return;
    }

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("onboarding_success") === "true") {
        notify("🎉 Brand Brief saved. Minions is now finding your first content ideas.");
        urlParams.delete("onboarding_success");
        const remainingQuery = urlParams.toString();
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}`
        );
      }
    }
  }, [needsBrief, router, notify]);

  const handleSignIn = useCallback(() => signInWithGoogle("/onboarding"), []);
  const handleSignOut = useCallback(() => signOut({ callbackUrl: "/login" }), []);

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
    isHarvesting,
    onHarvest: triggerHarvest,
    blogEnabled,
  };

  return (
    <div className="dashboard-readable flex min-h-screen bg-[#0a0d12] text-ink">
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
        sessionLoading={status === "loading"}
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
          isHarvesting={isHarvesting}
          onHarvest={triggerHarvest}
        />

        {notification && (
          <div className="bg-brand/20 border-b border-brand/40 px-4 sm:px-6 py-2 text-xs font-medium text-brand flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{notification}</span>
            <button onClick={clearNotification} className="hover:opacity-75 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="p-3.5 pb-28 sm:p-6 md:p-8 md:pb-8 flex-1 max-w-7xl w-full mx-auto">
          {redirecting ? <PageSkeleton label="Opening your workspace" /> : children}
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
