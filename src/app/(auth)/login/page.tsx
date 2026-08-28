"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  Bot,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "AI Idea Harvester",
    desc: "Scans industry news & trends to discover high-converting angles tailored to your brand.",
    badge: "Automated 2x/week",
    icon: TrendingUp,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    textAccent: "text-amber-400",
  },
  {
    step: "02",
    title: "Writer & Claims Gate",
    desc: "Drafts long-form copy + 16:9 studio cover art, then fact-checks every statistic for accuracy.",
    badge: "100% Brand Safe",
    icon: ShieldCheck,
    color: "from-[#00C9A7]/20 to-[#00C9A7]/5",
    border: "border-[#00C9A7]/30",
    textAccent: "text-[#00C9A7]",
  },
  {
    step: "03",
    title: "1-Click Omnichannel Sync",
    desc: "Broadcasts formatted executive copy directly to LinkedIn, Company Blog, Facebook & X.",
    badge: "Instant Publish",
    icon: Share2,
    color: "from-[#0077b5]/20 to-[#0077b5]/5",
    border: "border-[#0077b5]/30",
    textAccent: "text-[#0077b5]",
  },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

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
      {/* Background Ambient Aura */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-gradient-to-tr from-[#00C9A7]/15 via-[#0077b5]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-[#ff6b4a]/15 via-[#8B5CF6]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />

      {/* TOP HEADER / BRAND BAR */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <Link href="/" className="flex items-baseline group">
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
            Minions
          </span>
          <span className="text-[#00C9A7] font-bold text-2xl sm:text-3xl ml-0.5">
            .AI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1520]/80 border border-[#1F2D3D] backdrop-blur-md text-xs font-mono text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            <span className="text-white font-semibold">Autonomous Content Engine</span>
          </div>

          <Link
            href="/onboarding"
            className="px-3.5 py-1.5 rounded-xl border border-[#00C9A7]/40 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl">
          
          {/* LEFT COLUMN: GRAPHICAL PRODUCT WORKFLOW EXPLAINER */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            
            {/* Tagline & Headline */}
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-xs font-mono font-bold text-[#00C9A7]">
                <Zap className="w-3.5 h-3.5" />
                <span>AUTONOMOUS MARKETING COCKPIT</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Your content engine on autopilot.
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Minions researches industry trends, writes fact-checked thought-leadership posts, generates studio graphics, and broadcasts to your LinkedIn &amp; Blog in 1 click.
              </p>
            </div>

            {/* GRAPHICAL PIPELINE VISUALIZATION (3 Connected Stages) */}
            <div className="w-full space-y-3 pt-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isSelected = activeTab === idx;
                return (
                  <div
                    key={step.step}
                    onClick={() => setActiveTab(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 relative overflow-hidden ${
                      isSelected
                        ? "bg-[#0D1520] border-[#00C9A7] ring-1 ring-[#00C9A7]/50 shadow-lg shadow-[#00C9A7]/10"
                        : "bg-[#0D1520]/60 border-[#1F2D3D] hover:border-[#1F2D3D]/80 hover:bg-[#0D1520]"
                    }`}
                  >
                    {/* Glow Bar */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#00C9A7]" />
                    )}

                    {/* Step Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <IconComponent className={`w-5 h-5 ${step.textAccent}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                          <span className="font-mono text-xs text-[#64748B]">{step.step}.</span>
                          {step.title}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30 flex-shrink-0">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIVE POST PREVIEW MOCKUP */}
            <div className="w-full p-4 rounded-2xl bg-[#070B0F]/90 border border-[#1F2D3D] flex items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0077b5] flex items-center justify-center text-white font-bold text-sm">
                  in
                </div>
                <div>
                  <div className="text-[#F1F5F9] font-semibold text-xs flex items-center gap-1.5">
                    <span>Executive Thought-Leadership</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] text-[#64748B]">Auto-synced to LinkedIn &amp; Blog</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#00C9A7] text-[11px] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Claims Verified</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: AUTHENTICATION & TRIAL CARD */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#0D1520]/95 backdrop-blur-3xl border border-[#1F2D3D] ring-1 ring-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6 relative overflow-hidden">
              
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#00C9A7]/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#0077b5]/10 blur-3xl pointer-events-none rounded-full" />

              {/* Logo / Header */}
              <div className="flex flex-col items-center text-center space-y-3 pb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12242a] via-[#0D1520] to-[#070B0F] border-2 border-[#00C9A7]/40 flex items-center justify-center shadow-xl shadow-[#00C9A7]/10 relative group">
                  <Image src="/icon.svg" alt="Minions.AI" width={44} height={44} className="w-10 h-10" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00C9A7]/30 to-[#0077b5]/30 rounded-2xl blur-lg opacity-40 -z-10" />
                </div>
                
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-baseline justify-center">
                    <span>Minions</span>
                    <span className="text-[#00C9A7] ml-0.5">.AI</span>
                    <span className="text-slate-400 text-xs ml-2 font-mono font-normal">Cockpit</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Sign in to manage your content fleet &amp; reviews
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
                      {error === "AccessDenied" ? (
                        <>
                          We don&apos;t recognize this Google account yet. If you&apos;re joining an
                          existing team, ask your workspace owner to invite you — otherwise,{" "}
                          <Link href="/onboarding" className="underline hover:text-red-200 font-semibold">
                            start a free trial
                          </Link>{" "}
                          to set up your own workspace in 2 minutes.
                        </>
                      ) : (
                        "Authentication failed. Please verify your credentials and try again."
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE SIGN IN BUTTON */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#070B0F] font-bold text-sm rounded-2xl transition-all shadow-xl hover:shadow-white/20 flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 group border border-slate-200"
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

                {/* Free Trial Banner for New Visitors */}
                <div className="p-3.5 rounded-2xl bg-[#070B0F]/80 border border-[#1F2D3D] text-center space-y-1.5">
                  <p className="text-xs text-[#94A3B8]">
                    New to Minions? Start free in 2 minutes.
                  </p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00C9A7] hover:underline"
                  >
                    <span>Start 14-Day Trial &amp; Build First Draft</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Security & System Operational Highlights */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#1F2D3D]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Multi-Tenant Engine Live</span>
                </div>
                <span className="font-mono text-[10px] text-[#475569]">Supabase Vault Encrypted</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-[#64748B] border-t border-[#1F2D3D]/50">
        <p>© 2026 Minions.AI Technologies Inc. Autonomous Multi-Agent Systems.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070B0F] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
