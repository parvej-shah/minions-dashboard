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
  ShieldCheck,
  Zap,
  Globe,
  Share2,
  Lock,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

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
      {/* Dynamic Background Aura */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[400px] bg-[#00C9A7]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[400px] bg-[#0077b5]/10 blur-[130px] pointer-events-none rounded-full" />

      {/* NAVIGATION HEADER */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline group">
          <span className="font-extrabold text-2xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
            Minions
          </span>
          <span className="text-[#00C9A7] font-bold text-2xl ml-0.5">
            .AI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-[#070B0F] text-xs font-bold transition-all shadow-md shadow-[#00C9A7]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <span>{isLoading ? "Connecting…" : "Start Free Trial"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN HERO SPLIT */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 sm:py-8 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: CLEAR PRODUCT VALUE PROP */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-xs font-mono font-bold text-[#00C9A7]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YOUR 24/7 AI GHOSTWRITER</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Turn your expertise into high-authority posts &amp; articles.
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl">
                Minions researches industry trends, ghostwrites fact-checked thought leadership in your exact voice, and broadcasts to your LinkedIn and Blog in 1 click.
              </p>
            </div>

            {/* 3 Clear Value Pillars */}
            <div className="space-y-3.5 w-full pt-1">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1520]/60 border border-[#1F2D3D]/80">
                <div className="w-8 h-8 rounded-lg bg-[#00C9A7]/10 border border-[#00C9A7]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-[#00C9A7]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F1F5F9]">Ghostwritten in Your True Voice</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    Calibrates against your real writing habits, sentence cadence, and personal perspective.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1520]/60 border border-[#1F2D3D]/80">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F1F5F9]">Deterministic Fact-Checking Gate</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    Every statistic, customer claim, and technical metric is strictly audited before review.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0D1520]/60 border border-[#1F2D3D]/80">
                <div className="w-8 h-8 rounded-lg bg-[#0077b5]/10 border border-[#0077b5]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4 text-[#0077b5]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F1F5F9]">1-Click Omnichannel Broadcast</h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    Publishes instantly to your LinkedIn Profile, Company Page, and self-hosted Blog.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ELEVATED, CLEAN AUTH CARD */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-[#0D1520] border border-[#1F2D3D] ring-1 ring-white/5 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5 relative">
              
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#12242a] via-[#0D1520] to-[#070B0F] border border-[#00C9A7]/40 flex items-center justify-center shadow-lg shadow-[#00C9A7]/10">
                  <Image src="/icon.svg" alt="Minions.AI" width={36} height={36} className="w-8 h-8" />
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Welcome to Minions.AI
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Sign in or start your 14-day free trial
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-red-300/90 leading-relaxed">
                    Sign-in failed. Please try again.
                  </div>
                </div>
              )}

              {/* GOOGLE SIGN IN BUTTON */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] text-[#070B0F] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg hover:shadow-white/20 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group border border-slate-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#070B0F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
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
                  <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
                  {!isLoading && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-black group-hover:translate-x-0.5 transition-all ml-auto" />
                  )}
                </button>

                <p className="text-[11px] text-center text-[#64748B] pt-1">
                  Instant access • No credit card required
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* CLEAN MINIMAL FOOTER */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#64748B] border-t border-[#1F2D3D]/40">
        <p>© 2026 Minions.AI</p>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="hover:text-[#94A3B8] transition-colors">Documentation</Link>
          <span>•</span>
          <Link href="/onboarding" className="hover:text-[#94A3B8] transition-colors">Pricing</Link>
        </div>
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
