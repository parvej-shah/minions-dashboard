"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { DistributionChannelConfig } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] hover:text-[#00C9A7] transition-colors"
      >
        <KeyRound className="w-3 h-3" />
        {channel.has_credential ? "Rotate credential" : "Connect credential"}
      </button>
    );
  }

  return (
    <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
      {!isBlog && (
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder="Page / org ID (e.g. Facebook Page ID)"
          className="w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-1.5 text-[11px] font-mono text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]"
        />
      )}
      <input
        type={isBlog ? "url" : "password"}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder={isBlog ? "https://yoursite.com/webhook/..." : "Access token"}
        className="w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-1.5 text-[11px] font-mono text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]"
      />
      {error && <p className="text-[11px] text-[#ff6b4a]">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#00C9A7] text-[#070B0F] font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-[11px] font-mono px-2.5 py-1 rounded-lg text-[#64748B] hover:text-[#F1F5F9]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
