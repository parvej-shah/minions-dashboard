"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Smartphone, Share, PlusSquare, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (PWA installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Check localStorage dismiss timestamp
    const dismissedUntil = localStorage.getItem("minions_pwa_dismissed_until");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Handle Chromium / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log("[PWA] App successfully installed!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // If iOS and not dismissed, show prompt after a short delay (3s)
    if (isAppleDevice && !checkStandalone()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    // Dismiss for 7 days
    localStorage.setItem("minions_pwa_dismissed_until", (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
  };

  if (isStandalone || !isVisible || pathname === "/login") {
    return null;
  }

  return (
    <aside aria-label="Install App" className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative bg-[#0D1520]/95 backdrop-blur-xl border border-[#1F2D3D] ring-1 ring-white/10 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3">
        {/* Glow backdrop */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-10 bg-[#00C9A7]/20 blur-2xl pointer-events-none rounded-full" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12242a] to-[#0a0d12] border border-[#1F2D3D] flex items-center justify-center shadow-md shrink-0">
              <img src="/icons/icon-192x192.png" alt="Minions Logo" className="w-7 h-7 rounded-lg" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                Install Minions Cockpit
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8] line-clamp-1">
                Install as standalone app for instant access & offline caching
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#64748B] hover:text-[#F1F5F9] p-1 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Dismiss installation prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-Step Guide */}
        {showIOSGuide ? (
          <div className="p-3 bg-[#070B0F]/90 rounded-xl border border-[#1F2D3D] text-xs text-[#94A3B8] space-y-2">
            <p className="font-medium text-[#F1F5F9] flex items-center gap-1.5 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-[#00C9A7]" />
              How to install on iOS Safari:
            </p>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1F2D3D] text-[#00C9A7] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                1
              </span>
              <span>Tap the <strong className="text-white">Share</strong> button in Safari (<Share className="w-3.5 h-3.5 inline mx-0.5 text-[#00C9A7]" />)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1F2D3D] text-[#00C9A7] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                2
              </span>
              <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#00C9A7]" />)</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#00C9A7] to-[#00A389] hover:from-[#00E5BE] hover:to-[#00C9A7] text-[#070B0F] font-semibold text-xs transition-all shadow-lg shadow-[#00C9A7]/20 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {isIOS ? "Show iOS Install Guide" : "Install App to Mobile"}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-[#121B26] hover:bg-[#1A2634] text-[#94A3B8] hover:text-[#F1F5F9] font-medium text-xs transition-colors border border-[#1F2D3D] cursor-pointer"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
