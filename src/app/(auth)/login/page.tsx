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
  FileText,
  Globe,
  ImageIcon,
  ThumbsUp,
  MessageSquareText,
  Repeat2,
  Clock,
  Flame,
} from "lucide-react";

interface ShowcaseTab {
  id: "linkedin" | "blog" | "channels";
  label: string;
  badge: string;
  icon: any;
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  { id: "linkedin", label: "LinkedIn Ghostwriting", badge: "Executive Voice", icon: Sparkles },
  { id: "blog", label: "In-Depth Blog Articles", badge: "SEO & Authority", icon: FileText },
  { id: "channels", label: "Omnichannel Sync", badge: "1-Click Live", icon: Share2 },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"linkedin" | "blog" | "channels">("linkedin");

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
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 left-1/4 w-[650px] h-[500px] bg-gradient-to-tr from-[#00C9A7]/15 via-[#0077b5]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />
      <div className="absolute -bottom-32 right-1/4 w-[650px] h-[500px] bg-gradient-to-bl from-[#ff6b4a]/15 via-[#8B5CF6]/10 to-transparent blur-[140px] pointer-events-none rounded-full animate-pulse" />

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
            <span className="text-white font-semibold">Autonomous Ghostwriter &amp; Content Engine</span>
          </div>

          <Link
            href="/onboarding"
            className="px-4 py-2 rounded-xl border border-[#00C9A7]/40 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-[#00C9A7]/20"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center max-w-6xl">
          
          {/* LEFT COLUMN: WHAT MINIONS ACTUALLY DELIVERS (THE PRODUCT) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
            
            {/* Tagline & Core Value Prop */}
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-xs font-mono font-bold text-[#00C9A7]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>YOUR 24/7 EXECUTIVE GHOSTWRITER</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Never write a LinkedIn post from scratch again.
              </h1>
              
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Minions turns 15 minutes of weekly review into a continuous stream of high-authority LinkedIn posts, long-form articles, and branded graphics — ghostwritten in your exact voice.
              </p>
            </div>

            {/* TAB SELECTOR: WHAT YOU GET */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D1520] border border-[#1F2D3D] w-full sm:w-auto">
              {SHOWCASE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#00C9A7] text-[#070B0F] shadow-md shadow-[#00C9A7]/20"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* PRODUCT ARTIFACT SHOWCASE MOCKUP */}
            <div className="w-full rounded-2xl bg-[#0D1520] border border-[#1F2D3D] shadow-2xl p-5 space-y-4 relative overflow-hidden">
              
              {activeTab === "linkedin" && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0077b5] to-[#00C9A7] flex items-center justify-center font-bold text-white text-sm">
                        PS
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                          <span>Parvej Shah</span>
                          <span className="text-[10px] font-normal text-[#94A3B8]">• 1st</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#0077b5]/20 text-[#0077b5] text-[9px] font-mono font-bold">PRO</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] line-clamp-1">
                          Building Autonomous Multi-Agent Systems • Founder @ Minions
                        </div>
                        <div className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" /> 2h • 🌐 Public
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fact-Checked
                    </div>
                  </div>

                  {/* Post Copy */}
                  <div className="text-xs text-[#E2E8F0] space-y-2 leading-relaxed">
                    <p className="font-semibold text-white">
                      Stop Migrating History: The Data Forensics Protocol for High-Stakes Migrations.
                    </p>
                    <p className="text-[#94A3B8]">
                      Most systems migrations fail not because the destination software is flawed, but because teams attempt to migrate 10 years of dirty transactional history.
                    </p>
                    <div className="p-3 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-[11px] font-mono space-y-1">
                      <div className="text-[#00C9A7]">✦ Phase 1: Clean master data snapshot</div>
                      <div className="text-[#00C9A7]">✦ Phase 2: Cut over active orders with verified schema</div>
                      <div className="text-[#00C9A7]">✦ Phase 3: Archive legacy DB to cold read-only storage</div>
                    </div>
                  </div>

                  {/* 16:9 Studio Cover Image Mockup */}
                  <div className="relative rounded-xl overflow-hidden aspect-[16/8] bg-gradient-to-br from-[#121B27] via-[#070B0F] to-[#162736] border border-[#1F2D3D] flex flex-col justify-end p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(#00C9A7_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    <div className="relative z-10 space-y-1">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00C9A7] text-[#070B0F] font-extrabold uppercase">
                        Architecture Blueprint
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Deterministic Migration Pipeline • Zero Downtime
                      </h4>
                    </div>
                  </div>

                  {/* Social Engagement Stats */}
                  <div className="pt-2 border-t border-[#1F2D3D]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 hover:text-white cursor-pointer"><ThumbsUp className="w-3.5 h-3.5 text-[#0077b5]" /> 184 Likes</span>
                      <span className="flex items-center gap-1 hover:text-white cursor-pointer"><MessageSquareText className="w-3.5 h-3.5 text-[#00C9A7]" /> 42 Comments</span>
                      <span className="flex items-center gap-1 hover:text-white cursor-pointer"><Repeat2 className="w-3.5 h-3.5 text-amber-400" /> 19 Reposts</span>
                    </div>
                    <span className="text-[#00C9A7] font-semibold">1-Click Approved ✓</span>
                  </div>
                </div>
              )}

              {activeTab === "blog" && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#161D26] text-[#00C9A7] border border-[#00C9A7]/30">
                      LONG-FORM TECHNICAL ARTICLE (1,200 WORDS)
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">4 Min Read</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Why Deterministic Schema Validation Replaces Prompt Engineering in 2026
                  </h3>

                  <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                    As LLMs grow in capability, the biggest engineering trap is attempting to guide complex multi-step agents using natural language prompts alone. When scale demands 99.9% uptime, compile-time schema contracts become mandatory.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D] text-center">
                      <div className="text-sm font-bold text-[#00C9A7]">100%</div>
                      <div className="text-[10px] text-[#64748B]">Audited Sources</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D] text-center">
                      <div className="text-sm font-bold text-amber-400">SEO Ready</div>
                      <div className="text-[10px] text-[#64748B]">Meta Tags &amp; Slug</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D] text-center">
                      <div className="text-sm font-bold text-[#0077b5]">Custom Hook</div>
                      <div className="text-[10px] text-[#64748B]">Self-Hosted Blog</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "channels" && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="text-xs font-semibold text-white">
                    Simultaneous 1-Click Broadcast Destinations
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Approve once in your Editorial Studio. Minions formats and publishes directly to all your active channels:
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-[#070B0F] border border-[#0077b5]/30 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white font-bold text-xs">in</div>
                      <div>
                        <div className="text-xs font-bold text-white">LinkedIn</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Personal + Page</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070B0F] border border-[#00C9A7]/30 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00C9A7] flex items-center justify-center text-[#070B0F] font-bold text-xs"><Globe className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-white">Company Blog</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Direct Webhook / CMS</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070B0F] border border-blue-500/30 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">f</div>
                      <div>
                        <div className="text-xs font-bold text-white">Facebook</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Photo &amp; Timeline</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070B0F] border border-slate-700 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs font-serif">𝕏</div>
                      <div>
                        <div className="text-xs font-bold text-white">X / Twitter</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Threads &amp; Hooks</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 4 CORE VALUE PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#1F2D3D] flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[#94A3B8]">True Voice Match</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#1F2D3D] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[#94A3B8]">Zero Hallucinations</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#1F2D3D] flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                <span className="text-[#94A3B8]">16:9 Cover Art</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1520] border border-[#1F2D3D] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#0077b5] shrink-0" />
                <span className="text-[#94A3B8]">15 Mins / Week</span>
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
              <div className="flex flex-col items-center text-center space-y-3 pb-1">
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
                    Sign in to command your content engine
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

                {/* Free Trial Banner for New Visitors */}
                <div className="p-4 rounded-2xl bg-[#070B0F]/80 border border-[#1F2D3D] text-center space-y-2">
                  <p className="text-xs text-[#94A3B8]">
                    New to Minions? Try it free for 14 days.
                  </p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#00C9A7] hover:underline"
                  >
                    <span>Build Your Brand Engine in 2 Mins</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Security & System Highlights */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#1F2D3D]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Verified OAuth 2.0</span>
                </div>
                <span className="font-mono text-[10px] text-[#475569]">Supabase Vault Encrypted</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-[#64748B] border-t border-[#1F2D3D]/50">
        <p>© 2026 Minions.AI Technologies Inc. Autonomous Ghostwriting &amp; Thought-Leadership.</p>
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
