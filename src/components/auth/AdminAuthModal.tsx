"use client";

import React, { useState } from "react";
import { Lock, AlertCircle, LogOut, X, CheckCircle2, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { signInWithGoogle } from "@/lib/googleSignIn";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { ERASE_CONFIRM } from "@/lib/account";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
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
      await signInWithGoogle("/");
    } catch (err) {
      setAuthError(
        `Google OAuth Error: ${err instanceof Error ? err.message : "Failed to initialize Google OAuth"}`
      );
      setIsProcessing(false);
    }
  };

  if (currentUser) {
    return (
      <Modal isOpen onClose={onClose} maxWidthClass="max-w-sm" hideCloseButton>
        <AccountPanel user={currentUser} onClose={onClose} onLogout={onLogout} />
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} maxWidthClass="max-w-lg" hideCloseButton>
      <div className="text-ink">
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-coral/10 border-coral/30 text-coral">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-ink text-base">Minions</span>
                <span className="text-coral font-bold text-base">.AI</span>
              </div>
              <p className="text-xs text-muted mt-0.5">Sign in to continue</p>
            </div>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Sign in with your authorized Google account to access the Minions.AI Cockpit, agent fleet telemetry, and editorial controls.
            </p>

            <button
              onClick={handleGoogleOAuth}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-ink font-bold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
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

            <div className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-2 text-xs text-muted">
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

          {authError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-ink transition-colors cursor-pointer"
      aria-label="Close"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

/**
 * Who is signed in, Sign out, and a quiet way to erase the account. Erasing
 * asks for the word typed out; the server checks it again.
 */
function AccountPanel({ user, onClose, onLogout }: { user: AdminUser; onClose: () => void; onLogout: () => void }) {
  const [erasing, setErasing] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = typed.trim().toLowerCase() === ERASE_CONFIRM;

  const erase = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiClient.delete("/api/account", { confirm: typed });
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't erase your account. Try again."));
      setBusy(false);
    }
  };

  if (erasing) {
    return (
      <div className="p-5 sm:p-6 text-ink">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
          <Trash2 className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Erase your account?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Your workspace, posts, ideas and brand are deleted for good. This can&apos;t be undone. A workspace you share with teammates stays for them.
        </p>
        <label className="mt-5 block text-sm text-muted">
          Type <span className="font-mono font-bold text-ink">{ERASE_CONFIRM}</span> to confirm
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmed && !busy && void erase()}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-base text-ink focus:border-danger focus:outline-none"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            block
            disabled={busy}
            onClick={() => {
              setErasing(false);
              setTyped("");
              setError(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" block disabled={!confirmed} loading={busy} onClick={() => void erase()}>
            Erase forever
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 text-ink">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-base font-bold text-brand">
          {(user.name || user.email || "U")[0].toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{user.name || "Your account"}</div>
          <div className="truncate text-sm text-muted">{user.email}</div>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <Button variant="secondary" block icon={<LogOut className="h-4 w-4" />} onClick={onLogout} className="mt-5">
        Sign out
      </Button>
      {user.role !== "SYSTEM_ADMIN" && (
        <button
          type="button"
          onClick={() => setErasing(true)}
          className="mx-auto mt-3 block rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-danger cursor-pointer"
        >
          Erase my account
        </button>
      )}
    </div>
  );
}
