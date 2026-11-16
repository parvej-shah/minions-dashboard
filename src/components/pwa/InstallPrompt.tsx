"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download, X, Smartphone, Share, PlusSquare, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "minions_pwa_dismissed_until";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isIOSDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return isIOSDevice() || /android|webos|blackberry|iemobile|opera mini|mobile/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");
    const appleDevice = isIOSDevice();
    const mobileDevice = isMobileDevice();

    const initializationTimer = window.setTimeout(() => {
      setIsStandalone(standalone);
      setIsIOS(appleDevice);
    }, 0);
    if (standalone) return () => window.clearTimeout(initializationTimer);

    let dismissedUntil = 0;
    try {
      dismissedUntil = Number(localStorage.getItem(DISMISS_KEY)) || 0;
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }

    let promptTimer: ReturnType<typeof setTimeout> | undefined;
    const revealPrompt = () => {
      if (document.visibilityState === "visible") {
        setIsVisible(true);
      }
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (Date.now() >= dismissedUntil) {
        promptTimer = setTimeout(revealPrompt, 2_000);
      }
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    const handleManualOpen = () => {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        // Ignore storage errors.
      }
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("minions:open-install-prompt", handleManualOpen);

    // On mobile devices, reveal prompt after a swift 3.5s delay if not dismissed.
    if (Date.now() >= dismissedUntil && mobileDevice) {
      promptTimer = setTimeout(revealPrompt, 3_500);
    }

    return () => {
      if (promptTimer) clearTimeout(promptTimer);
      window.clearTimeout(initializationTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("minions:open-install-prompt", handleManualOpen);
    };
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    setShowGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      // Dismiss for this view even if persistent storage is unavailable.
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
        return;
      } catch {
        // Fall back to showing manual browser instructions below.
      }
    }
    setShowGuide(true);
  };

  if (isStandalone || !isVisible || pathname === "/login") return null;

  return (
    <aside
      aria-label="Install Minions"
      className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-3 right-3 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300 md:bottom-6 md:left-auto md:right-6"
    >
      <div className="relative flex flex-col gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-float backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2">
              <Image src="/icons/icon-192x192.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink">Add Minions to your home screen</h3>
              <p className="text-xs text-muted">A focused, app-like way to open your workspace.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 cursor-pointer"
            aria-label="Dismiss installation suggestion"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {showGuide ? (
          <div className="space-y-2 rounded-xl border border-line bg-canvas/90 p-3 text-xs text-muted">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <Smartphone className="h-4 w-4 text-brand" aria-hidden="true" />
              {isIOS ? "Install on iPhone or iPad" : "Install on your phone"}
            </p>
            {isIOS ? (
              <>
                <p>If you are not in Safari, open this page in Safari first. Then tap Share and choose &ldquo;Add to Home Screen&rdquo;.</p>
                <div className="flex items-center gap-2 text-brand font-medium">
                  <Share className="h-4 w-4" aria-hidden="true" />
                  <PlusSquare className="h-4 w-4" aria-hidden="true" />
                  <span>Share → Add to Home Screen</span>
                </div>
              </>
            ) : (
              <>
                <p>Tap your browser&apos;s menu (three dots) in the top or bottom corner, then select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</p>
                <div className="flex items-center gap-2 text-brand font-medium">
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  <PlusSquare className="h-4 w-4" aria-hidden="true" />
                  <span>Menu (⋮) → Add to Home screen</span>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="min-h-11 text-sm font-semibold text-brand cursor-pointer"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-float cursor-pointer hover:bg-brand/90 active:scale-[0.98] transition-all"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              {deferredPrompt ? "Install app" : isIOS ? "How to install" : "Add to home screen"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-muted cursor-pointer hover:bg-surface-2 transition-colors"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
