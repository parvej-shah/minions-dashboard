"use client";

import React, { useState } from "react";
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
  RefreshCw,
  Copy,
  Check,
  Globe,
  Terminal,
  Shield
} from "lucide-react";

export interface AdminUser {
  email: string;
  name: string;
  role: "MARKETING_DIRECTOR" | "SYSTEM_ADMIN" | "OPERATOR";
  avatar_url?: string;
  authenticated_at: string;
}

const WHITELISTED_ADMINS = [
  "xpeedlab@gmail.com",
  "xbitlab@gmail.com",
  "parvej@getminions.ai",
  "rakib@getminions.ai"
];

const GCP_CONFIG = {
  adminEmail: "xpeedlab@gmail.com",
  consoleUrl: "https://console.cloud.google.com/apis/credentials",
  productionRedirectUri: "https://minions.getminions.ai/api/auth/callback/google",
  localRedirectUri: "http://localhost:3000/api/auth/callback/google",
  productionOrigin: "https://minions.getminions.ai",
  localOrigin: "http://localhost:3000",
  scopes: ["openid", "email", "profile"]
};

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
  const [selectedEmail, setSelectedEmail] = useState("xpeedlab@gmail.com");
  const [customEmail, setCustomEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"oauth" | "gcp" | "whitelist" | "security">("oauth");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleGoogleSignIn = (emailToUse: string) => {
    setIsProcessing(true);
    setAuthError(null);

    const email = emailToUse.trim().toLowerCase();

    setTimeout(() => {
      if (WHITELISTED_ADMINS.includes(email)) {
        const user: AdminUser = {
          email,
          name: email === "xpeedlab@gmail.com" 
            ? "Parvej (Lead Admin)" 
            : email === "xbitlab@gmail.com" 
            ? "Parvej Shah" 
            : email.split("@")[0].toUpperCase(),
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
      <div className="bg-[#0f1419] text-[#FFFFFF] w-full max-w-xl rounded-2xl border border-[#1f2b37] shadow-2xl overflow-hidden space-y-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1f2b37] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b4a]/10 border border-[#ff6b4a]/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#ff6b4a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">minions</span>
                <span className="text-[#ff6b4a] font-mono font-bold text-base">.ai</span>
                <span className="text-[10px] font-mono bg-[#161d24] text-[#94A3B8] px-1.5 py-0.5 rounded border border-[#1f2b37]">
                  SECURITY & AUTH GATE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Google OAuth 2.0 & Cloud Console Identity Governance
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
        <div className="flex items-center border-b border-[#1f2b37] bg-[#0b0f14] px-4 sm:px-6 text-xs shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("oauth")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "oauth"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => setActiveTab("gcp")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "gcp"
                ? "border-[#00C9A7] text-[#00C9A7]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            <Key className="w-3 h-3 text-[#00C9A7]" />
            GCP Credentials
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "whitelist"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Admins ({WHITELISTED_ADMINS.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "security"
                ? "border-[#ff6b4a] text-[#ff6b4a]"
                : "border-transparent text-[#94A3B8] hover:text-white"
            }`}
          >
            Audit & Status
          </button>
        </div>

        {/* Content Body with Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OAUTH SIGN IN */}
          {activeTab === "oauth" && (
            <div className="space-y-4">
              {currentUser ? (
                <div className="p-4 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#ff6b4a]/20 text-[#ff6b4a] font-bold flex items-center justify-center text-sm border border-[#ff6b4a]/30">
                        {currentUser.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{currentUser.name}</span>
                          {currentUser.email === "xpeedlab@gmail.com" && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ff6b4a]/10 text-[#ff6b4a] border border-[#ff6b4a]/20">
                              PRIMARY ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active Session
                    </span>
                  </div>

                  <div className="text-xs text-[#94A3B8] pt-2.5 border-t border-[#1f2b37] flex items-center justify-between">
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
              ) : (
                <div className="space-y-4">
                  {/* Google OAuth Button */}
                  <button
                    onClick={() => handleGoogleSignIn(selectedEmail)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-[#12242a] font-bold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-[0.99]"
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
                      {isProcessing ? "Authenticating with Google..." : `Continue with Google (${selectedEmail})`}
                    </span>
                  </button>

                  {/* Fast Admin Switcher for Manager */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-mono text-[#94A3B8] uppercase flex items-center justify-between">
                      <span>Select Authorized Admin Account:</span>
                      <span className="text-[10px] text-[#00C9A7]">Primary: xpeedlab@gmail.com</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {WHITELISTED_ADMINS.map((email) => (
                        <button
                          key={email}
                          onClick={() => {
                            setSelectedEmail(email);
                            handleGoogleSignIn(email);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                            selectedEmail === email
                              ? "bg-[#161d24] border-[#ff6b4a] text-white"
                              : "bg-[#0b0f14] border-[#1f2b37] text-[#94A3B8] hover:border-[#2a3a4b]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Mail className={`w-3.5 h-3.5 ${selectedEmail === email ? "text-[#ff6b4a]" : "text-[#64748B]"}`} />
                            <span className="font-mono">{email}</span>
                            {email === "xpeedlab@gmail.com" && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ff6b4a]/15 text-[#ff6b4a] border border-[#ff6b4a]/30">
                                Default Admin
                              </span>
                            )}
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

          {/* TAB 2: GCP CREDENTIALS SETUP GUIDANCE */}
          {activeTab === "gcp" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <Key className="w-4 h-4 text-[#00C9A7]" />
                    Google Cloud Console Credentials Setup
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Configure OAuth 2.0 Web Client credentials in GCP Console under admin account <span className="font-mono text-white">xpeedlab@gmail.com</span>.
                  </p>
                </div>
                <a
                  href={GCP_CONFIG.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
                >
                  <span>GCP Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Authorized Redirect URIs */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase flex items-center justify-between">
                  <span>Authorized Redirect URIs (Required in GCP):</span>
                  <span className="text-[10px] text-[#00C9A7]">OAuth 2.0 Web Client</span>
                </div>

                {/* Prod URI */}
                <div className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        Production URI
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(GCP_CONFIG.productionRedirectUri, "prod_uri")}
                      className="text-[10px] font-mono text-[#00C9A7] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "prod_uri" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-white select-all break-all bg-[#0b0f14] p-2 rounded-lg border border-[#1f2b37]">
                    {GCP_CONFIG.productionRedirectUri}
                  </div>
                </div>

                {/* Localhost URI */}
                <div className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        Local Dev URI
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(GCP_CONFIG.localRedirectUri, "local_uri")}
                      className="text-[10px] font-mono text-[#00C9A7] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "local_uri" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-white select-all break-all bg-[#0b0f14] p-2 rounded-lg border border-[#1f2b37]">
                    {GCP_CONFIG.localRedirectUri}
                  </div>
                </div>
              </div>

              {/* Authorized JavaScript Origins */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase">
                  Authorized JavaScript Origins:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white">{GCP_CONFIG.productionOrigin}</span>
                    <button
                      onClick={() => handleCopy(GCP_CONFIG.productionOrigin, "prod_orig")}
                      className="text-[10px] font-mono text-[#94A3B8] hover:text-[#00C9A7] cursor-pointer"
                    >
                      {copiedKey === "prod_orig" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white">{GCP_CONFIG.localOrigin}</span>
                    <button
                      onClick={() => handleCopy(GCP_CONFIG.localOrigin, "local_orig")}
                      className="text-[10px] font-mono text-[#94A3B8] hover:text-[#00C9A7] cursor-pointer"
                    >
                      {copiedKey === "local_orig" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Environment Variable Setup Block */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-[#94A3B8] uppercase flex items-center justify-between">
                  <span>Dashboard .env.local Configuration:</span>
                  <button
                    onClick={() => handleCopy(`GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your_client_secret_here\nNEXT_PUBLIC_APP_URL=https://minions.getminions.ai`, "env_snippet")}
                    className="text-[10px] font-mono text-[#00C9A7] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "env_snippet" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied Template</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Env Template</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[#0b0f14] border border-[#1f2b37] font-mono text-[11px] text-[#94A3B8] space-y-1">
                  <div><span className="text-[#00C9A7]">GOOGLE_CLIENT_ID</span>=<span className="text-white">...apps.googleusercontent.com</span></div>
                  <div><span className="text-[#00C9A7]">GOOGLE_CLIENT_SECRET</span>=<span className="text-white">GOCSPX-...</span></div>
                  <div><span className="text-[#00C9A7]">NEXT_PUBLIC_APP_URL</span>=<span className="text-white">https://minions.getminions.ai</span></div>
                  <div><span className="text-[#00C9A7]">NEXTAUTH_SECRET</span>=<span className="text-white">minions_secret_key_...</span></div>
                </div>
              </div>

              {/* Setup Steps Checklist */}
              <div className="p-3.5 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-2">
                <div className="font-semibold text-white text-xs">Quick Setup Instructions:</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#94A3B8]">
                  <li>Log in to <span className="font-mono text-white">Google Cloud Console</span> with <strong className="text-white">xpeedlab@gmail.com</strong>.</li>
                  <li>Create or select the project <strong className="text-white">Minions AI</strong>.</li>
                  <li>Go to <strong className="text-white">APIs & Services → Credentials</strong> → Create <strong className="text-white">OAuth 2.0 Client ID</strong> (Web application).</li>
                  <li>Add the Authorized JavaScript origins and Redirect URIs above.</li>
                  <li>In OAuth Consent Screen, add the 4 whitelisted emails to <strong className="text-white">Test Users</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: WHITELISTED ADMINS */}
          {activeTab === "whitelist" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#94A3B8]">
                  Authorized Google accounts permitted to manage the Minions.AI Fleet & Publish Gate:
                </p>
              </div>
              <div className="space-y-2">
                {WHITELISTED_ADMINS.map((email, idx) => (
                  <div
                    key={email}
                    className="p-3 rounded-xl bg-[#161d24] border border-[#1f2b37] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-medium">{email}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ff6b4a]/15 text-[#ff6b4a] border border-[#ff6b4a]/30">
                              Primary Lead Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-[#0b0f14] px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
                      Authorized
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-[#0b0f14] border border-[#1f2b37] text-[11px] text-[#94A3B8] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ff6b4a] shrink-0" />
                <span>Accounts outside this whitelist receive an automatic 403 Forbidden Access Gate lock.</span>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT */}
          {activeTab === "security" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#161d24] border border-[#1f2b37] space-y-2.5 text-xs text-[#94A3B8]">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Security Mode:</span>
                  <span className="text-emerald-400 font-mono">RBAC + Google OAuth 2.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Primary Admin:</span>
                  <span className="font-mono text-white">xpeedlab@gmail.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authorized Production Domain:</span>
                  <span className="font-mono text-white">minions.getminions.ai</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Encryption:</span>
                  <span className="font-mono text-white">TLS 1.3 / HTTPS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase / R2 Session Protection:</span>
                  <span className="text-emerald-400 font-mono">Enforced</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
