"use client";

import React, { useState } from "react";
import {
  Lock,
  AlertCircle,
  LogOut,
  X,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { signIn } from "next-auth/react";
import type { UserRole } from "@/constants/access";

export interface AdminUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  authenticated_at: string;
  supabase_project?: string;
}

interface AdminAuthProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser | null;
  onLogin: (user: AdminUser) => void;
  onLogout: () => void;
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}: AdminAuthProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleGoogleOAuth = async () => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      // Mark a pending signup first, as the login page does, or a new Google
      // account is refused by the signIn callback (AccessDenied).
      await fetch("/api/onboarding/begin", { method: "POST" });
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setAuthError(
        `Google OAuth Error: ${err instanceof Error ? err.message : "Failed to initialize Google OAuth"}`
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface text-[#FFFFFF] w-full max-w-lg rounded-2xl border border-[#1f2b37] shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1f2b37] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                currentUser
                  ? "bg-brand/10 border-brand/30 text-brand"
                  : "bg-coral/10 border-coral/30 text-coral"
              }`}
            >
              {currentUser ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  Minions
                </span>
                <span className="text-coral font-bold text-base">.AI</span>
                <span className="text-[10px] font-mono bg-[#161d24] text-brand px-2 py-0.5 rounded border border-brand/30">
                  {currentUser ? "ACCOUNT" : "SECURITY GATE"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {currentUser
                  ? "Authenticated Session & Access Profile"
                  : "Google OAuth 2.0 Access Control"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#161d24] text-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {currentUser ? (
            /* Logged-In User Profile View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center text-sm border border-brand/30">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {currentUser.name || "Authenticated User"}
                      </div>
                      <div className="text-xs text-muted font-mono">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Session
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1f2b37] text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0b0f14] border border-[#1f2b37]">
                    <div className="text-[10px] font-mono text-subtle uppercase">
                      Access Role
                    </div>
                    <div className="font-semibold text-brand mt-0.5">
                      {currentUser.role || "MEMBER"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0b0f14] border border-[#1f2b37]">
                    <div className="text-[10px] font-mono text-subtle uppercase">
                      Auth Method
                    </div>
                    <div className="font-semibold text-white mt-0.5 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#3B82F6]" />
                      Google OAuth
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onLogout()}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#161d24] hover:bg-[#1f2b37] border border-[#1f2b37] text-xs text-muted hover:text-white font-medium cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Logged-Out Sign-In View */
            <div className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Sign in with your authorized Google account to access the Minions.AI Cockpit, agent fleet telemetry, and editorial controls.
              </p>

              <button
                onClick={handleGoogleOAuth}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-[#12242a] font-bold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
              >
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
                <span>
                  {isProcessing ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>

              <div className="p-3.5 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Secure OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Role-based workspace access protection</span>
                </div>
              </div>
            </div>
          )}

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
