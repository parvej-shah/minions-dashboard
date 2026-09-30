"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Share2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { DistributionChannelConfig } from "@/types";
import { useDistributionChannels } from "@/hooks/useDistributionChannels";
import { useToast } from "@/hooks/useToast";
import { ChannelCredentialForm } from "./ChannelCredentialForm";

interface DistributionControlPanelProps {
  compact?: boolean;
  onChannelChange?: (channels: DistributionChannelConfig[]) => void;
  /** Only render channels whose key is in this list. Omit to show all four
   * (the default, unchanged behavior for existing callers e.g. Fleet). Used
   * by the onboarding done page to show only the channels the tenant picked
   * during setup, not the full catalogue including ones they never chose. */
  channelFilter?: string[];
}

export function DistributionControlPanel({
  compact = false,
  onChannelChange,
  channelFilter,
}: DistributionControlPanelProps) {
  const { data, isLoading, pendingId, toggleChannel, setData, reload } = useDistributionChannels();
  const { message: notification, show: showNotification } = useToast(3500);
  const channels = channelFilter
    ? data.channels.filter((c) => channelFilter.includes(c.key))
    : data.channels;
  const updatingKey = channels.find((c) => c.id === pendingId)?.key ?? null;

  useEffect(() => {
    if (!isLoading && onChannelChange) onChannelChange(channels);
  }, [isLoading, channels, onChannelChange]);

  const handleToggle = async (channel: DistributionChannelConfig) => {
    const nextState = !channel.is_active;
    const previous = data.channels;

    // Optimistic update, reverted below if the write fails.
    setData((prev) => ({
      ...prev,
      channels: prev.channels.map((c) =>
        c.id === channel.id ? { ...c, is_active: nextState } : c
      ),
    }));

    const success = await toggleChannel(channel.id, nextState);

    if (success) {
      showNotification(
        `${channel.name} automated posting is now ${nextState ? "ACTIVATED" : "PAUSED"}.`
      );
    } else {
      setData((prev) => ({ ...prev, channels: previous }));
      showNotification(`Failed to update ${channel.name}. Please try again.`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "BLOG":
        return <Globe className="w-4 h-4 text-brand" />;
      case "FACEBOOK":
        return <span className="text-sm font-black text-[#1877F2]">f</span>;
      case "LINKEDIN":
        return <span className="text-xs font-black text-[#0A66C2]">in</span>;
      case "TWITTER":
        return <span className="text-xs font-black text-ink">𝕏</span>;
      default:
        return <Share2 className="w-4 h-4 text-muted" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-line flex items-center justify-center gap-3 text-xs font-mono text-muted">
        <RefreshCw className="w-4 h-4 animate-spin text-brand" />
        <span>Loading distribution channel controls...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {notification && (
          <div className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-brand/15 border border-brand/30 text-brand flex items-center gap-2 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>{notification}</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {channels.map((ch) => {
            const isActive = ch.is_active;
            const isBusy = updatingKey === ch.key;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleToggle(ch)}
                disabled={isBusy}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-surface-2 border-brand/40 shadow-sm shadow-brand/5"
                    : "bg-[#0A0E14] border-line opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-canvas border border-line flex items-center justify-center shrink-0">
                      {getPlatformIcon(ch.platform)}
                    </div>
                    <span className="text-xs font-bold text-ink truncate">{ch.name.split(" ")[0]}</span>
                  </div>
                  {/* Micro toggle indicator */}
                  <div
                    className={`w-6 h-3.5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                      isActive ? "bg-brand justify-end" : "bg-line justify-start"
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? "bg-brand" : "bg-subtle"
                    }`}
                  />
                  <span className={isActive ? "text-brand font-semibold" : "text-[#A0ACBA]"}>
                    {isActive ? "Auto Post" : "Paused"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-surface/70 border border-line/80 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/60 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">Publishing channels</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">Choose which connected channels receive posts when you publish.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="min-h-10 px-3 rounded-lg bg-[#111820] border border-line text-[#CBD5E1] inline-flex items-center text-xs font-medium tabular-nums">
            {channels.filter((c) => c.is_active).length} of {channels.length} active
          </span>
        </div>
      </div>

      {notification && (
        <div className="text-xs font-mono px-4 py-2 rounded-xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
            <span>{notification}</span>
          </div>
          <span className="text-[10px] text-brand/70 font-mono">Changes saved</span>
        </div>
      )}

      {/* Grid of 4 Channel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {channels.map((ch) => {
          const isActive = ch.is_active;
          const isBusy = updatingKey === ch.key;

          return (
            <div
              key={ch.id}
              className={`p-4 sm:p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 relative ${
                isActive
                  ? "bg-[#111A20] border-brand/35"
                  : "bg-[#0C1117] border-[#273342]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#080D12] border border-[#263443] flex items-center justify-center shrink-0">
                    {getPlatformIcon(ch.platform)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ink truncate">{ch.name}</span>
                      {ch.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas text-muted border border-line">
                          {ch.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#8493A5] truncate mt-1">
                      {ch.target_destination}
                    </div>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(ch)}
                  disabled={isBusy}
                  role="switch"
                  aria-checked={isActive}
                  aria-label={`Toggle ${ch.name}`}
                  className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    isActive ? "bg-brand" : "bg-line"
                  } ${isBusy ? "opacity-50 cursor-wait" : ""}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-[#AAB6C5] leading-relaxed">
                {ch.description}
              </p>

              {/* Footer Status Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs pt-3 border-t border-[#263443]/70">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? "bg-brand animate-pulse" : "bg-subtle"
                    }`}
                  />
                  <span className={isActive ? "text-brand font-semibold" : "text-subtle"}>
                    {isActive ? "Broadcasting Active" : "Broadcast Paused"}
                  </span>
                </div>
                <span className="text-[#8190A2] sm:text-right">
                  {isActive ? "Auto-Posts on Publish" : "Skipped on Publish"}
                </span>
              </div>

              {/* Credential connection. Blog defaults to our own hosted blogs
                  table when nothing is connected — a webhook here redirects
                  publishing to the tenant's own site instead. */}
              <div className="pt-3 border-t border-[#263443]/70">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs ${ch.has_credential ? "text-brand" : "text-[#A0ACBA]"}`}
                  >
                    {ch.has_credential
                      ? ch.key === "blog"
                        ? "● Publishing to your own site"
                        : "● Credential connected"
                      : ch.key === "blog"
                        ? "○ Publishing to our hosted blog"
                        : "○ No credential yet"}
                  </span>
                </div>
                <ChannelCredentialForm channel={ch} onSaved={reload} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
