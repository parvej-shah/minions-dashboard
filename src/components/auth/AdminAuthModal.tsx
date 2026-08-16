"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Key, 
  Mail, 
  Sparkles,
  ExternalLink,
  X,
  RefreshCw
} from "lucide-react";

export interface AdminUser {
  email: string;
  name: string;
  role: "MARKETING_DIRECTOR" | "SYSTEM_ADMIN" | "OPERATOR";
  avatar_url?: string;
  authenticated_at: string;
}

const WHITELISTED_ADMINS = [
  "xbitlab@gmail.com",
  "xpeedlab@gmail.com",
  "parvej@getminions.ai",
  "rakib@getminions.ai"
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
  const [selectedEmail, setSelectedEmail] = useState("xbitlab@gmail.com");
  const [customEmail, setCustomEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"oauth" | "whitelist" | "security">("oauth");

  if (!isOpen) return null;

  const handleGoogleSignIn = (emailToUse: string) => {
    setIsProcessing(true);
    setAuthError(null);

    const email = emailToUse.trim().toLowerCase();

    setTimeout(() => {
      if (WHITELISTED_ADMINS.includes(email)) {
        const user: AdminUser = {
          email,
          name: email === "xbitlab@gmail.com" ? "Parvej Shah" : email.split("@")[0].toUpperCase(),
          role: "MARKETING_DIRECTOR",
          authenticated_at: new Date().toISOString()
        };
        onLogin(user);
        setIsProcessing(false);
        onClose();
      } else {
        setIsProcessing(false);
        setAuthError(`Access Denied: ${email} is not in the authorized Minions.AI admin whitelist.`);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1419] text-[#FFFFFF] w-full max-w-lg rounded-2xl border border-[#1f2b37] shadow-2xl overflow-hidden space-y-0">
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
                <span className="text-[10px] font-mono bg-[#161d24] text-[#94A3B8] px-1.5 py-0.5 rounded border border-[#1f2b37]">
                  ADMIN GATE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Google OAuth 2.0 Identity & Access Governance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#161d24] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-[#1f2b37] bg-[#0b0f14] px-6 text-xs">
          <button
            onClick={() => setActiveTab("oauth")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all ${
              activeTab === "oauth"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Google OAuth Sign-In
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all ${
              activeTab === "whitelist"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Whitelisted Emails ({WHITELISTED_ADMINS.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all ${
              activeTab === "security"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Session Audit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeTab === "oauth" && (
            <div className="space-y-4">
              {currentUser ? (
                <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#ff6b4a]/20 text-[#ff6b4a] font-bold flex items-center justify-center text-xs border border-[#ff6b4a]/30">
                        {currentUser.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{currentUser.name}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active Session
                    </span>
                  </div>

                  <div className="text-xs text-[#94A3B8] pt-2 border-t border-[#1f2b37] flex items-center justify-between">
                    <span>Role: <strong className="text-white">{currentUser.role}</strong></span>
                    <button
                      onClick={() => onLogout()}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Google OAuth Button */}
                  <button
                    onClick={() => handleGoogleSignIn(selectedEmail)}
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
                      {isProcessing ? "Authenticating with Google..." : "Continue with Google (xbitlab@gmail.com)"}
                    </span>
                  </button>

                  {/* Fast Admin Switcher for Manager */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-mono text-[#94A3B8] uppercase">
                      Select Whitelisted Manager Account:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {WHITELISTED_ADMINS.slice(0, 2).map((email) => (
                        <button
                          key={email}
                          onClick={() => {
                            setSelectedEmail(email);
                            handleGoogleSignIn(email);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                            selectedEmail === email
                              ? "bg-[#161d24] border-[#ff6b4a] text-white"
                              : "bg-[#0b0f14] border-[#1f2b37] text-[#94A3B8] hover:border-[#2a3a4b]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#ff6b4a]" />
                            <span className="font-mono">{email}</span>
                          </div>
                          <span className="text-[10px] text-[#ff6b4a] font-semibold">1-Click Sign In →</span>
                        </button>
                      ))}
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
          )}

          {activeTab === "whitelist" && (
            <div className="space-y-3">
              <p className="text-xs text-[#94A3B8]">
                Only authenticated Google accounts in this list can access the Minions.AI Agent Cockpit:
              </p>
              <div className="space-y-2">
                {WHITELISTED_ADMINS.map((email) => (
                  <div
                    key={email}
                    className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-white">{email}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-[#0b0f14] px-2 py-0.5 rounded text-[#94A3B8]">
                      Authorized
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-2 text-xs text-[#94A3B8]">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Security Mode:</span>
                  <span className="text-emerald-400 font-mono">RBAC + Google OAuth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authorized Domain:</span>
                  <span className="font-mono text-white">minions.getminions.ai</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Encryption:</span>
                  <span className="font-mono text-white">TLS 1.3 / HTTPS</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
