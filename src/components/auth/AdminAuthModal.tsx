"use client";

import React, { useState } from "react";
import {
  Lock,
  AlertCircle,
  LogOut,
  ExternalLink,
  X,
  Database,
  Check,
} from "lucide-react";
import {
  signIn,
} from "next-auth/react";

export interface AdminUser {
  id?: string;
  email: string;
  name: string;
  role: "MARKETING_DIRECTOR" | "SYSTEM_ADMIN" | "OPERATOR";
  avatar_url?: string;
  authenticated_at: string;
  supabase_project?: string;
}

export const SUPABASE_ADMIN_USERS: { email: string; name: string; role: "MARKETING_DIRECTOR" | "SYSTEM_ADMIN"; desc: string }[] = [
  {
    email: "xpeedlab@gmail.com",
    name: "XpeedLab Admin",
    role: "SYSTEM_ADMIN",
    desc: "Cloud Infrastructure & Agent Pipeline Admin"
  }
];

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
  onLogin,
  onLogout
}: AdminAuthProps) {
  const [selectedEmail, setSelectedEmail] = useState("parvejshahlabib007@gmail.com");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"supabase" | "google_oauth" | "users" | "gcp">("supabase");

  if (!isOpen) return null;

  // 1. Real Google OAuth via NextAuth
  const handleRealGoogleOAuth = async () => {
    setIsProcessing(true);
    setAuthError(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      setAuthError(
        `Google OAuth Error: ${err instanceof Error ? err.message : "Failed to initialize Google OAuth"}`
      );
      setIsProcessing(false);
    }
  };

  // 2. Real Supabase User Sign-In
  const handleSupabaseSignIn = async (emailToUse: string) => {
    setIsProcessing(true);
    setAuthError(null);

    const email = emailToUse.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAuthError(data.error || "Authentication failed");
        setIsProcessing(false);
        return;
      }

      onLogin(data.user);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setAuthError(`Network error: ${err instanceof Error ? err.message : "request failed"}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1419] text-[#FFFFFF] w-full max-w-xl rounded-2xl border border-[#1f2b37] shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-6 border-b border-[#1f2b37] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b4a]/10 border border-[#ff6b4a]/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#ff6b4a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">minions</span>
                <span className="text-[#ff6b4a] font-mono font-bold text-base">.ai</span>
                <span className="text-[10px] font-mono bg-[#161d24] text-[#00C9A7] px-2 py-0.5 rounded border border-[#00C9A7]/30 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" />
                  SUPABASE AUTH
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Real Supabase Auth & Google OAuth 2.0 Access Control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#161d24] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-[#1f2b37] bg-[#0b0f14] px-4 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("supabase")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "supabase"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Supabase Users
          </button>
          <button
            onClick={() => setActiveTab("google_oauth")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "google_oauth"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => setActiveTab("gcp")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "gcp"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Google Cloud Console
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[480px] overflow-y-auto">
          {activeTab === "supabase" && (
            <div className="space-y-4">
              {currentUser ? (
                <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#ff6b4a]/20 text-[#ff6b4a] font-bold flex items-center justify-center text-sm border border-[#ff6b4a]/30">
                        {currentUser.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{currentUser.name}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active Supabase Session
                    </span>
                  </div>

                  <div className="text-xs text-[#94A3B8] pt-2 border-t border-[#1f2b37] flex items-center justify-between">
                    <span>Role: <strong className="text-white">{currentUser.role}</strong></span>
                    <button
                      onClick={() => onLogout()}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Supabase Users List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Provisioned Supabase Database Accounts:</span>
                  <span className="font-mono text-[#00C9A7]">Project: kneafaxwkopodiausljf</span>
                </div>

                <div className="space-y-2">
                  {SUPABASE_ADMIN_USERS.map((admin) => (
                    <div
                      key={admin.email}
                      onClick={() => {
                        setSelectedEmail(admin.email);
                        handleSupabaseSignIn(admin.email);
                      }}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        currentUser?.email === admin.email
                          ? "bg-[#161d24] border-[#00C9A7] text-white shadow-sm"
                          : "bg-[#0b0f14] border-[#1f2b37] text-[#94A3B8] hover:border-[#ff6b4a] hover:bg-[#161d24]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#161d24] border border-[#1f2b37] flex items-center justify-center text-xs font-bold text-white">
                          {admin.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{admin.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0b0f14] text-[#00C9A7] border border-[#1f2b37]">
                              {admin.role}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[#94A3B8]">{admin.email}</div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">{admin.desc}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {currentUser?.email === admin.email ? (
                          <span className="text-xs font-bold text-[#00C9A7] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#ff6b4a] group-hover:underline">
                            {isProcessing && selectedEmail === admin.email ? "Authenticating..." : "1-Click Login →"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "google_oauth" && (
            <div className="space-y-4">
              <p className="text-xs text-[#94A3B8]">
                Sign in with your official Google account. Real OAuth redirect is powered by Supabase Auth with Google Cloud Console client credentials.
              </p>

              <button
                onClick={handleRealGoogleOAuth}
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
                  {isProcessing ? "Redirecting to Google..." : "Continue with Google (xpeedlab@gmail.com)"}
                </span>
              </button>

              <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-2 text-xs text-[#94A3B8]">
                <div className="font-semibold text-white">OAuth Redirect URL configured in Supabase:</div>
                <div className="font-mono text-[11px] text-[#00C9A7] bg-[#070B0F] p-2 rounded border border-[#1f2b37]">
                  https://kneafaxwkopodiausljf.supabase.co/auth/v1/callback
                </div>
              </div>
            </div>
          )}

          {activeTab === "gcp" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Google Cloud Console Configuration:</span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ff6b4a] hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>console.cloud.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2 text-[#94A3B8]">
                  <div>
                    <span className="text-white font-medium">Primary Account:</span>{" "}
                    <code className="text-[#00C9A7] font-mono">xpeedlab@gmail.com</code>
                  </div>
                  <div>
                    <span className="text-white font-medium">Authorized Redirect URI:</span>
                    <div className="font-mono text-[11px] text-white bg-[#070B0F] p-2 rounded mt-1 border border-[#1f2b37]">
                      https://kneafaxwkopodiausljf.supabase.co/auth/v1/callback
                    </div>
                  </div>
                  <div>
                    <span className="text-white font-medium">Authorized JavaScript Origin:</span>
                    <div className="font-mono text-[11px] text-white bg-[#070B0F] p-2 rounded mt-1 border border-[#1f2b37]">
                      https://minions.getminions.ai
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
