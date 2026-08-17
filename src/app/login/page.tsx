"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, AlertTriangle, ArrowRight, Bot, Sparkles, CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#070B0F] text-[#F1F5F9] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#00C9A7]/20 selection:text-[#00C9A7]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-[#00C9A7]/15 via-[#ff6b4a]/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#00C9A7]/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121B26] border border-[#1F2D3D] text-[11px] font-mono text-[#00C9A7] shadow-inner mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            SECURE ACCESS GATEWAY
          </div>
          
          <div className="flex items-baseline justify-center">
            <span className="font-extrabold text-4xl tracking-tight text-white">Minions</span>
            <span className="text-[#ff6b4a] font-extrabold text-4xl ml-0.5">.AI</span>
          </div>
          
          <p className="text-sm text-[#94A3B8] max-w-xs mx-auto">
            Autonomous Marketing & Operations Cockpit. Sign in with your authorized admin account to continue.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-2xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-red-300">Access Denied</div>
              <div className="text-red-300/80 leading-relaxed">
                {error === "AccessDenied"
                  ? "Your Google account is not on the authorized whitelist. Please contact Parvej or switch to an authorized email."
                  : "Authentication failed. Please try again."}
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#0D1520]/90 backdrop-blur-2xl border border-[#1F2D3D] ring-1 ring-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-[#070B0F] font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-white/20 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#070B0F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#1F2D3D]" />
              <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider">Enterprise Security</span>
              <div className="flex-1 h-px bg-[#1F2D3D]" />
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                <ShieldCheck className="w-4 h-4 text-[#00C9A7] shrink-0" />
                <span>Strict email whitelist enforcement</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                <Bot className="w-4 h-4 text-[#ff6b4a] shrink-0" />
                <span>4-worker n8n autonomous pipeline controls</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                <Lock className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span>Encrypted session tokens with JWT verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#64748B] space-y-1">
          <p>© 2026 Minions.AI Technologies Inc.</p>
          <p className="font-mono text-[10px] text-[#475569]">minions.getminions.ai • internal cockpit</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B0F] flex items-center justify-center text-white">
        <div className="w-6 h-6 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
