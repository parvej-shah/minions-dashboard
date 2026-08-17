"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-baseline group">
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
            Minions
          </span>
          <span className="text-[#ff6b4a] font-extrabold text-2xl sm:text-3xl ml-0.5">
            .AI
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1520]/80 border border-[#1F2D3D] backdrop-blur-md shadow-inner text-xs font-mono text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
          <span className="text-white font-semibold">Autonomous AI Fleet</span>
        </div>
      </header>

      {/* MAIN VIEWPORT SPLIT */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: 3D MASCOT SQUAD HERO SHOWCASE (DESKTOP & TABLET) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8">
            
            {/* Tagline & Title */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/30 text-xs font-mono font-bold text-[#ff6b4a]">
                <Zap className="w-3.5 h-3.5" />
                <span>MEET YOUR 24/7 AI CREW</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Never miss another call. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#00C9A7] via-[#38BDF8] to-[#ff6b4a] bg-clip-text text-transparent">
                  Your AI workforce is ready.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Log in to command your fleet of voice dispatchers, review real-time operations, and orchestrate omnichannel growth.
              </p>
            </div>

            {/* MASCOT HERO STAGE */}
            <div className="relative w-full max-w-lg flex flex-col items-center py-4">
              
              {/* Radial Glow Halo behind Mascot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-radial from-[#00C9A7]/20 via-[#ff6b4a]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

              {/* Trio Mascots Presentation on Mobile & Desktop */}
              <div className="relative flex items-end justify-center gap-2 sm:gap-6 my-2 sm:my-4">
                
                {/* Flanking Mascot 1 (Gia - Left) */}
                <div 
                  onClick={() => setActiveMascotIndex(1)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 1 
                      ? "scale-110 z-20 -translate-y-2 opacity-100" 
                      : "scale-90 opacity-75 hover:opacity-100 hover:scale-95"
                  } animate-float-reverse`}
                >
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#00C9A7]/15 to-[#070B0F]/80 p-2 border border-[#00C9A7]/30 backdrop-blur-md shadow-xl flex items-center justify-center relative group">
                    <img 
                      src="/images/mascots/gia.png" 
                      alt="Gia" 
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" 
                    />
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#070B0F] border border-[#00C9A7]/40 text-[10px] font-mono text-[#00C9A7] font-bold">
                      Gia
                    </span>
                  </div>
                </div>

                {/* Center Lead Mascot (Rex - Primary Hero) */}
                <div 
                  onClick={() => setActiveMascotIndex(0)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 0 
                      ? "scale-115 z-30 -translate-y-4 opacity-100" 
                      : "scale-95 opacity-80 hover:opacity-100"
                  } animate-float-slow`}
                >
                  <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-b from-[#ff6b4a]/20 via-[#12242a]/60 to-[#070B0F] p-3 border-2 border-[#ff6b4a]/40 backdrop-blur-xl shadow-2xl shadow-[#ff6b4a]/20 flex items-center justify-center relative group">
                    <img 
                      src="/images/mascots/rex.png" 
                      alt="Rex" 
                      className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform" 
                    />
                    <span className="absolute -bottom-2.5 px-3 py-0.5 rounded-full bg-[#ff6b4a] text-white text-xs font-mono font-extrabold shadow-md">
                      Rex • Lead
                    </span>
                  </div>
                </div>

                {/* Flanking Mascot 2 (Otto - Right) */}
                <div 
                  onClick={() => setActiveMascotIndex(2)}
                  className={`cursor-pointer transition-all duration-300 transform ${
                    activeMascotIndex === 2 
                      ? "scale-110 z-20 -translate-y-2 opacity-100" 
                      : "scale-90 opacity-75 hover:opacity-100 hover:scale-95"
                  } animate-float-slow`}
                >
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#3B82F6]/15 to-[#070B0F]/80 p-2 border border-[#3B82F6]/30 backdrop-blur-md shadow-xl flex items-center justify-center relative group">
                    <img 
                      src="/images/mascots/otto.png" 
                      alt="Otto" 
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" 
                    />
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#070B0F] border border-[#3B82F6]/40 text-[10px] font-mono text-[#3B82F6] font-bold">
                      Otto
                    </span>
                  </div>
                </div>

              </div>

              {/* Active Mascot Role Pill */}
              <div className="mt-4 px-4 py-2 rounded-2xl bg-[#0D1520]/80 border border-[#1F2D3D] backdrop-blur-md max-w-sm text-center animate-in fade-in duration-300">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F1F5F9]">
                  <span className={activeMascot.accent}>{activeMascot.name}</span>
                  <span className="text-[#64748B]">•</span>
                  <span className="text-[#94A3B8]">{activeMascot.role}</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                  {activeMascot.description}
                </p>
              </div>

              {/* Mascot Mini Selector Dots */}
              <div className="flex items-center gap-1.5 mt-3">
                {MASCOTS.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMascotIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeMascotIndex === idx 
                        ? "w-6 bg-[#00C9A7]" 
                        : "w-2 bg-[#1F2D3D] hover:bg-[#334155]"
                    }`}
                    title={m.name}
                  />
                ))}
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: AUTHENTICATION CARD (WORLD CLASS GLASSMORPHISM) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#0D1520]/90 backdrop-blur-3xl border border-[#1F2D3D] ring-1 ring-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6 relative overflow-hidden">
              
              {/* Subtle Card Inner Shimmer */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#00C9A7]/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#ff6b4a]/10 blur-3xl pointer-events-none rounded-full" />

              {/* Card Header */}
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/30 flex items-center justify-center text-[#00C9A7]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Executive Portal
                  </h2>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Single Sign-On access for authorized Minions administrators.
                </p>
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
              <div className="space-y-4 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-4 px-5 bg-white hover:bg-slate-100 text-[#070B0F] font-bold text-sm rounded-2xl transition-all shadow-xl hover:shadow-white/20 active:scale-[0.98] flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 group border border-slate-200"
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
                    {isLoading ? "Connecting to Workspace..." : "Continue with Google"}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-black group-hover:translate-x-0.5 transition-all ml-auto" />
                  )}
                </button>

                {/* Security Feature Highlights */}
                <div className="p-4 rounded-2xl bg-[#070B0F]/60 border border-[#1F2D3D] space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
                    <span>Real-time agent telemetry & call transcripts</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
                    <span>Instant 1-click editorial claims verification</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                    <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
                    <span>End-to-end encrypted session management</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#1F2D3D]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Systems Operational</span>
                </div>
                <span className="font-mono text-[10px] text-[#475569]">v2.4.0 • Cockpit</span>
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
