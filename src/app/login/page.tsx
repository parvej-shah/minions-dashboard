"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Bot, 
  PhoneCall, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface MascotInfo {
  id: string;
  name: string;
  role: string;
  image: string;
  accent: string;
  glowColor: string;
  description: string;
}

const MASCOTS: MascotInfo[] = [
  {
    id: "rex",
    name: "Rex",
    role: "Lead Voice Agent",
    image: "/images/mascots/rex.png",
    accent: "text-[#ff6b4a]",
    glowColor: "from-[#ff6b4a]/25 via-[#ff6b4a]/5 to-transparent",
    description: "Answers phone calls in <1s, speaks fluent trade context, and books jobs directly."
  },
  {
    id: "gia",
    name: "Gia",
    role: "Speed-to-Lead & SMS",
    image: "/images/mascots/gia.png",
    accent: "text-[#00C9A7]",
    glowColor: "from-[#00C9A7]/25 via-[#00C9A7]/5 to-transparent",
    description: "Texts back missed calls in seconds, qualifies homeowner needs, and syncs to CRM."
  },
  {
    id: "otto",
    name: "Otto",
    role: "Fleet Sentinel & QA",
    image: "/images/mascots/otto.png",
    accent: "text-[#3B82F6]",
    glowColor: "from-[#3B82F6]/25 via-[#3B82F6]/5 to-transparent",
    description: "Monitors operations, verifies call recordings, and maintains strict quality standards."
  },
  {
    id: "pip",
    name: "Pip",
    role: "Omnichannel Dispatch",
    image: "/images/mascots/pip.png",
    accent: "text-[#8B5CF6]",
    glowColor: "from-[#8B5CF6]/25 via-[#8B5CF6]/5 to-transparent",
    description: "Manages live web chat, answers customer inquiries, and routes priority leads."
  },
  {
    id: "zip",
    name: "Zip",
    role: "Calendar Orchestrator",
    image: "/images/mascots/zip.png",
    accent: "text-[#F59E0B]",
    glowColor: "from-[#F59E0B]/25 via-[#F59E0B]/5 to-transparent",
    description: "Orchestrates technician availability, avoids double-bookings, and locks in estimates."
  }
];

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMascotIndex, setActiveMascotIndex] = useState(0);

  const activeMascot = MASCOTS[activeMascotIndex];

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Sign in error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B0F] text-[#F1F5F9] flex flex-col justify-between relative overflow-hidden selection:bg-[#00C9A7]/20 selection:text-[#00C9A7]">
      {/* Dynamic Ambient Background Aura */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-gradient-to-tr from-[#00C9A7]/15 via-[#ff6b4a]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse-glow" />
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-[#3B82F6]/15 via-[#8B5CF6]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse-glow" />

      {/* TOP HEADER / BRAND BAR */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#12242a] to-[#0a0d12] border border-[#1F2D3D] flex items-center justify-center shadow-md shrink-0">
            <img src="/icon.svg" alt="Minions Logo" className="w-6 h-6" />
          </div>
          <div className="flex items-baseline">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
              Minions
            </span>
            <span className="text-[#ff6b4a] font-bold text-xl sm:text-2xl ml-0.5">
              .AI
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1520]/80 border border-[#1F2D3D] backdrop-blur-md shadow-inner text-xs font-mono text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
          <span className="text-white font-semibold">Autonomous Cockpit</span>
        </div>
      </header>

      {/* MAIN VIEWPORT SPLIT */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center max-w-5xl">
          
          {/* LEFT COLUMN: 3D MASCOT SQUAD (VISIBLE ON DESKTOP/TABLET, COMPACT ON MOBILE) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-start text-left space-y-6">
            
            {/* Tagline & Title */}
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/30 text-xs font-mono font-bold text-[#ff6b4a]">
                <Zap className="w-3.5 h-3.5" />
                <span>24/7 AUTONOMOUS CREW</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Your AI trade fleet is active.
              </h1>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Log in to command your autonomous voice agents, orchestrate speed-to-lead, and manage omnichannel editorial staging.
              </p>
            </div>

            {/* Mascot Trio Stage */}
            <div className="relative w-full max-w-md flex flex-col items-center py-2">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-[#00C9A7]/20 via-[#ff6b4a]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

              <div className="relative flex items-end justify-center gap-4 my-2">
                {/* Gia */}
                <div 
                  onClick={() => setActiveMascotIndex(1)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 1 ? "scale-105 z-20 opacity-100" : "scale-90 opacity-70 hover:opacity-100"
                  } animate-float-reverse`}
                >
                  <div className="w-24 h-24 rounded-2xl bg-[#0D1520]/80 p-2 border border-[#00C9A7]/30 backdrop-blur-md shadow-xl flex items-center justify-center relative">
                    <img src="/images/mascots/gia.png" alt="Gia" className="w-full h-full object-contain filter drop-shadow-md" />
                    <span className="absolute -bottom-2 px-2 py-0.2 rounded-full bg-[#070B0F] border border-[#00C9A7]/40 text-[9px] font-mono text-[#00C9A7] font-bold">
                      Gia
                    </span>
                  </div>
                </div>

                {/* Rex */}
                <div 
                  onClick={() => setActiveMascotIndex(0)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 0 ? "scale-110 z-30 opacity-100" : "scale-95 opacity-80 hover:opacity-100"
                  } animate-float-slow`}
                >
                  <div className="w-32 h-32 rounded-3xl bg-[#0D1520] p-2.5 border-2 border-[#ff6b4a]/40 backdrop-blur-xl shadow-2xl shadow-[#ff6b4a]/20 flex items-center justify-center relative">
                    <img src="/images/mascots/rex.png" alt="Rex" className="w-full h-full object-contain filter drop-shadow-xl" />
                    <span className="absolute -bottom-2.5 px-3 py-0.5 rounded-full bg-[#ff6b4a] text-white text-[10px] font-mono font-extrabold shadow-md">
                      Rex • Lead
                    </span>
                  </div>
                </div>

                {/* Otto */}
                <div 
                  onClick={() => setActiveMascotIndex(2)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 2 ? "scale-105 z-20 opacity-100" : "scale-90 opacity-70 hover:opacity-100"
                  } animate-float-slow`}
                >
                  <div className="w-24 h-24 rounded-2xl bg-[#0D1520]/80 p-2 border border-[#3B82F6]/30 backdrop-blur-md shadow-xl flex items-center justify-center relative">
                    <img src="/images/mascots/otto.png" alt="Otto" className="w-full h-full object-contain filter drop-shadow-md" />
                    <span className="absolute -bottom-2 px-2 py-0.2 rounded-full bg-[#070B0F] border border-[#3B82F6]/40 text-[9px] font-mono text-[#3B82F6] font-bold">
                      Otto
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Mascot Role Pill */}
              <div className="mt-3 px-3 py-1.5 rounded-xl bg-[#0D1520]/80 border border-[#1F2D3D] text-xs font-medium text-center">
                <span className={activeMascot.accent}>{activeMascot.name}</span>
                <span className="text-[#64748B] mx-1.5">•</span>
                <span className="text-[#94A3B8]">{activeMascot.role}</span>
              </div>
            </div>

          </div>

          {/* AUTHENTICATION CARD (CENTERED & CLEAN ON MOBILE) */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#0D1520]/95 backdrop-blur-3xl border border-[#1F2D3D] ring-1 ring-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6 relative overflow-hidden">
              
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#00C9A7]/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#ff6b4a]/10 blur-3xl pointer-events-none rounded-full" />

              {/* Mobile Hero Logo (Centered) */}
              <div className="flex flex-col items-center text-center space-y-3 pb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#12242a] via-[#0D1520] to-[#070B0F] border-2 border-[#00C9A7]/40 flex items-center justify-center shadow-xl shadow-[#00C9A7]/10 relative group">
                  <img src="/icon.svg" alt="Minions.AI" className="w-10 h-10 sm:w-12 sm:h-12" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00C9A7]/30 to-[#ff6b4a]/30 rounded-2xl blur-lg opacity-40 -z-10" />
                </div>
                
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-baseline justify-center">
                    <span>Minions</span>
                    <span className="text-[#ff6b4a] ml-0.5">.AI</span>
                    <span className="text-[#00C9A7] text-sm ml-1.5 font-mono font-normal">Cockpit</span>
                  </h1>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Autonomous Trade Marketing & Operations
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-2xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-red-300">Access Restricted</div>
                    <div className="text-red-300/80 leading-relaxed text-[11px]">
                      {error === "AccessDenied"
                        ? "This Google account is not authorized to access the cockpit. Please switch to an authorized administrator account."
                        : "Authentication failed. Please verify your credentials and try again."}
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE SIGN IN BUTTON */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-4 px-5 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#070B0F] font-bold text-sm rounded-2xl transition-all shadow-xl hover:shadow-white/20 flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 group border border-slate-200"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#070B0F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span className="text-sm font-bold">
                    {isLoading ? "Connecting..." : "Continue with Google"}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-black group-hover:translate-x-0.5 transition-all ml-auto" />
                  )}
                </button>

                {/* Security Feature Highlights */}
                <div className="p-3.5 rounded-2xl bg-[#070B0F]/60 border border-[#1F2D3D] space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                    <span>Real-time voice agent telemetry & operations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                    <span>Editorial review & omnichannel broadcast command</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#1F2D3D]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Systems Operational</span>
                </div>
                <span className="font-mono text-[10px] text-[#475569]">v2.4.0 • PWA Ready</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B] border-t border-[#1F2D3D]/50">
        <p>© 2026 Minions.AI Technologies Inc. All rights reserved.</p>
        <p className="font-mono text-[11px] text-[#475569]">minions.getminions.ai • internal operations</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B0F] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
