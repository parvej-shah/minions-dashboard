"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { DistributionChannelConfig } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";

import { buttonStyles } from "@/components/ui/Button";
/**
 * Inline token-paste form for one channel.
 *
 * Standing in for an OAuth "Connect" button until there's a verified
 * Facebook/LinkedIn developer app (see channel-token/route.ts). Shared by
 * DistributionControlPanel (post-signup, in Fleet) and the onboarding
 * wizard's done page (first connect, right after signup) — both call the
 * same POST /api/onboarding/channel-token endpoint.
 *
 * Blog is a webhook URL, not an access token + page/org id -- 03_review_publisher
 * POSTs the published asset directly to the tenant's own site/CMS/Zapier hook
 * instead of writing into our own hosted blogs table, so their content lands
 * on their own domain.
 */
export function ChannelCredentialForm({
  channel,
  onSaved,
}: {
  channel: DistributionChannelConfig;
  onSaved: () => void;
}) {
  const isBlog = channel.key === "blog";
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [externalId, setExternalId] = useState(channel.external_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!token.trim()) {
      setError(isBlog ? "Paste your webhook URL first." : "Paste a token first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/api/onboarding/channel-token", {
        channel: channel.key,
        token: token.trim(),
        external_id: externalId.trim(),
      });
      setToken("");
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save credential."));
    } finally {
      setSaving(false);
    }
  }

  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Disconnect ${channel.name}? Scheduled posts will skip this channel until reconnected.`)) {
      return;
    }
    setDisconnecting(true);
    try {
      await apiClient.delete("/api/channels", { channel: channel.key });
      onSaved();
    } catch (err) {
      setError(toErrorMessage(err, "Failed to disconnect channel."));
    } finally {
      setDisconnecting(false);
    }
  }

  if (!open) {
    if (channel.key === "linkedin") {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <a
            href="/api/auth/linkedin/connect"
            onClick={(e) => e.stopPropagation()}
            className="min-h-11 w-full sm:w-fit flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium px-3.5 py-2 rounded-lg bg-[#0077b5] text-white hover:bg-[#0077b5]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <KeyRound className="w-3 h-3" />
            {channel.has_credential ? "Reconnect with LinkedIn" : "Sign In with LinkedIn"}
          </a>
          {channel.has_credential && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 text-xs text-[#ff8b75] hover:text-coral hover:underline disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 text-xs leading-none text-[#A0ACBA] hover:text-brand transition-colors"
        >
          <KeyRound className="w-3 h-3" />
          {channel.has_credential ? "Rotate credential" : "Connect credential"}
        </button>
        {channel.has_credential && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-xs font-medium leading-none text-coral hover:underline disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
      {!isBlog && (
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder="Page / org ID (e.g. Facebook Page ID)"
          className="w-full rounded-lg bg-canvas border border-line px-3 py-1.5 text-[11px] font-mono text-ink placeholder:text-[#475569] focus:outline-none focus:border-brand"
        />
      )}
      <input
        type={isBlog ? "url" : "password"}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder={isBlog ? "https://yoursite.com/webhook/..." : "Access token"}
        className="w-full rounded-lg bg-canvas border border-line px-3 py-1.5 text-[11px] font-mono text-ink placeholder:text-[#475569] focus:outline-none focus:border-brand"
      />
      {error && <p className="text-[11px] text-coral">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={buttonStyles({ className: "w-full sm:w-auto" })}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="min-h-11 w-full sm:w-auto px-4 rounded-lg border border-[#273342] text-sm text-[#A0ACBA] hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
