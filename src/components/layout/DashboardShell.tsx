"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { X } from "lucide-react";
import AdminAuthModal from "@/components/auth/AdminAuthModal";
import CommandPalette from "./CommandPalette";
import AccountMenu from "./AccountMenu";
import { BottomTabs, TopNav } from "./TopNav";
import { useNavCounts } from "@/hooks/useNavCounts";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { shouldSendToBrief } from "@/lib/briefRedirect";
import { useToast } from "@/hooks/useToast";
import { buildNavItems } from "@/constants/nav";
import ImpersonationBanner from "./ImpersonationBanner";
import { PageSkeleton } from "@/components/ui/Skeleton";

export interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Dashboard chrome: the thin top menu (four places + avatar menu), the phone
 * tab bar, the command palette, and the harvest trigger. Every hook runs unconditionally; /login has its own layout
 * rather than an early return here.
 */
export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status, update } = useSession();

  // A new signup has no workspace until onboarding saves its first step. If
  // they leave onboarding (or open "/" directly) every page here would fail
  // with "not attached to a tenant", so send them back to finish it. Staff are
  // exempt: they work through platform-admin and view-as-tenant.
  //
  // The session in the browser is the copy fetched at sign-up, before the
  // workspace existed, and a client-side move from onboarding keeps it. So
  // re-read it first (the jwt callback reads the DB) and redirect only if it
  // still has no workspace; otherwise "Review my post" bounced between here
  // and setup, whose server check sees the finished workspace and sends it back.
  const needsWorkspace =
    status === "authenticated" && !!session?.user && !session.user.clientId && session.user.role !== "SYSTEM_ADMIN";
  // update() changes identity with every session, so it is read through a ref:
  // a user who truly has no workspace must get one re-read, not a loop of them.
  const updateRef = React.useRef(update);
  React.useEffect(() => {
    updateRef.current = update;
  }, [update]);
  React.useEffect(() => {
    if (!needsWorkspace) return;
    void updateRef.current().then((fresh) => {
      if (!fresh?.user?.clientId) router.replace("/onboarding/setup");
    });
  }, [needsWorkspace, router]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navCounts = useNavCounts();
  const navItems = buildNavItems();
  const channels = useChannelSummary();
  const { brandSettings, isLoading: brandLoading } = useBrandSettings();
  const blogEnabled = channels?.blog ?? true;
  const { message: notification, show: notify, clear: clearNotification } = useToast(6000);

  const quickNav = useCallback(
    (url: string) => {
      setShowPalette(false);
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // A workspace whose brand brief was never finished belongs in the wizard (not for staff viewing it).
  const needsBrief = shouldSendToBrief({
    brandLoading,
    hasSettings: !!brandSettings,
    positioning: brandSettings?.positioning,
    pathname,
    role: session?.user?.role,
  });
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
        notify("Your brand is saved. Minions is finding your first ideas.");
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

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navItems={navItems}
        onNavigate={quickNav}
      />

      <ImpersonationBanner />
      <TopNav
        navItems={navItems}
        navCounts={navCounts}
        pathname={pathname}
        isPlatformAdmin={session?.user?.role === "SYSTEM_ADMIN"}
        account={
          <AccountMenu
            session={session}
            navCounts={navCounts}
            blogEnabled={blogEnabled}
            onOpenAccount={() => setAuthModalOpen(true)}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        }
      />

      {notification && (
        <div role="status" className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <p className="flex-1 rounded-2xl bg-surface px-4 py-3 text-[15px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]">
            {notification}
          </p>
          <button type="button" onClick={clearNotification} aria-label="Dismiss" className="cursor-pointer rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 sm:pt-12 md:pb-16">
        {redirecting ? <PageSkeleton label="Opening your workspace" /> : children}
      </main>

      <BottomTabs navItems={navItems} navCounts={navCounts} pathname={pathname} />

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
        onLogout={() => {
          setAuthModalOpen(false);
          handleSignOut();
        }}
      />
    </div>
  );
}
