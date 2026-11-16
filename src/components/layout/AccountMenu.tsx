"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { resolveAccountIdentity } from "@/lib/layout/accountIdentity";
import type { NavCounts } from "@/types";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import QuotaMeter from "./QuotaMeter";

export interface AccountMenuProps {
  session: Session | null;
  navCounts: NavCounts | null;
  blogEnabled: boolean;
  onOpenAccount: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const item =
  "flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-[15px] text-ink transition-colors hover:bg-surface-2 disabled:cursor-default disabled:opacity-50";

/**
 * Everything that is not one of the four places: workspace, usage, schedule,
 * channels, billing, team, the live blog, admin, sign out.
 */
export default function AccountMenu({
  session,
  navCounts,
  blogEnabled,
  onOpenAccount,
  onSignIn,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { brandSettings } = useBrandSettings();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) {
    return (
      <button type="button" onClick={onSignIn} className="min-h-9 cursor-pointer rounded-full px-4 text-[15px] font-medium text-brand hover:bg-brand/5">
        Sign in
      </button>
    );
  }

  const domain = brandSettings?.company_domain;
  // A workspace without its own domain has no public blog of its own (same rule the old sidebar used).
  const blogUrl = domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : null;
  const showBlog = blogEnabled && Boolean(blogUrl);
  const { avatarUrl, displayName, initial } = resolveAccountIdentity(session.user, brandSettings);
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account and settings"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-surface-3 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={36} height={36} unoptimized referrerPolicy="no-referrer" className="h-9 w-9 object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="space-y-3 px-3 pb-3 pt-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">{displayName}</p>
              <p className="truncate text-sm text-muted">{session.user?.email}</p>
            </div>
            <WorkspaceSwitcher />
            {navCounts && <QuotaMeter quota={navCounts.quota} />}
          </div>
          <div className="h-px bg-line mx-2" />
          <div className="py-1">
            <Link role="menuitem" href="/schedule" onClick={close} className={item}>Publishing pace</Link>
            <Link role="menuitem" href="/fleet" onClick={close} className={item}>Channels</Link>
            {showBlog && blogUrl && (
              <a role="menuitem" href={blogUrl} target="_blank" rel="noopener noreferrer" onClick={close} className={item}>
                Your blog ↗
              </a>
            )}
          </div>
          <div className="h-px bg-line mx-2" />
          <div className="py-1">
            <Link role="menuitem" href="/settings/billing" onClick={close} className={item}>Billing</Link>
            <Link role="menuitem" href="/settings/team" onClick={close} className={item}>Team</Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenAccount();
                close();
              }}
              className={item}
            >
              Account
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("minions:open-install-prompt"));
                close();
              }}
              className={item}
            >
              Install app
            </button>
            {session.user?.role === "SYSTEM_ADMIN" && (
              <Link role="menuitem" href="/platform-admin" onClick={close} className={item}>Platform admin</Link>
            )}
          </div>
          <div className="h-px bg-line mx-2" />
          <div className="pt-1">
            <button type="button" role="menuitem" onClick={onSignOut} className={item}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
