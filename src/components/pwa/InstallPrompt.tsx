"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "minions_pwa_dismissed_until";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

function isIOSDevice() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");
    const appleDevice = isIOSDevice();
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
    if (Date.now() < dismissedUntil) {
      return () => window.clearTimeout(initializationTimer);
    }

    let promptTimer: ReturnType<typeof setTimeout> | undefined;
    const revealPrompt = () => {
      if (document.visibilityState === "visible") setIsVisible(true);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      promptTimer = setTimeout(revealPrompt, 25_000);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // iOS has no install prompt event. Wait until the person has had time to use the app.
    if (appleDevice) promptTimer = setTimeout(revealPrompt, 30_000);

    return () => {
      if (promptTimer) clearTimeout(promptTimer);
      window.clearTimeout(initializationTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      // Dismiss for this view even if persistent storage is unavailable.
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setIsVisible(false);
    setDeferredPrompt(null);
  };

  if (isStandalone || !isVisible || pathname === "/login") return null;

  return (
    <aside
      aria-label="Install Minions"
      className="fixed bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] left-3 right-3 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300 md:bottom-6 md:left-auto md:right-6"
    >
      <div className="relative flex flex-col gap-3 rounded-2xl border border-line bg-[#0D1520]/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-[#12242a]">
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
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-white/5"
            aria-label="Dismiss installation suggestion"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {showIOSGuide ? (
          <div className="space-y-2 rounded-xl border border-line bg-canvas/90 p-3 text-xs text-muted">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <Smartphone className="h-4 w-4 text-brand" aria-hidden="true" />
              Install on iPhone or iPad
            </p>
            <p>If you’re not in Safari, open this page there first. Then tap Share and choose “Add to Home Screen.”</p>
            <div className="flex items-center gap-2 text-brand">
              <Share className="h-4 w-4" aria-hidden="true" />
              <PlusSquare className="h-4 w-4" aria-hidden="true" />
              <span className="text-muted">Share → Add to Home Screen</span>
            </div>
            <button type="button" onClick={() => setShowIOSGuide(false)} className="min-h-11 text-sm font-semibold text-brand">
              Got it
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#00A389] px-4 text-sm font-semibold text-canvas shadow-lg shadow-brand/15"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isIOS ? "How to install" : "Install app"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 rounded-xl border border-line bg-[#121B26] px-4 text-sm font-medium text-muted"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
