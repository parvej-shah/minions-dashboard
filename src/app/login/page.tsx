"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

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
      {/* Ambient background blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[280px] bg-gradient-to-tr from-[#00C9A7]/10 via-[#ff6b4a]/5 to-transparent blur-[100px] pointer-events-none rounded-full" />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex items-baseline justify-center">
            <span className="font-extrabold text-3xl tracking-tight text-white">Minions</span>
            <span className="text-[#ff6b4a] font-extrabold text-3xl ml-0.5">.AI</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-2xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-300">
              {error === "AccessDenied"
                ? "Access restricted. Your account is not authorized."
                : "Authentication failed. Please try again."}
            </span>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-[#0D1520]/90 backdrop-blur-2xl border border-[#1F2D3D] ring-1 ring-white/5 rounded-3xl p-6 shadow-2xl shadow-black/80 space-y-5">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-[#070B0F] font-semibold text-sm rounded-2xl transition-all shadow-md hover:shadow-white/10 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#070B0F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#64748B]">
          <p>© 2026 Minions.AI</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B0F] flex items-center justify-center text-white">
        <div className="w-5 h-5 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
