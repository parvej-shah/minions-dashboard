"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Globe,
  Radio,
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
        return <Globe className="w-4 h-4 text-[#00C9A7]" />;
      case "FACEBOOK":
        return <span className="text-sm font-black text-[#1877F2]">f</span>;
      case "LINKEDIN":
        return <span className="text-xs font-black text-[#0A66C2]">in</span>;
      case "TWITTER":
        return <span className="text-xs font-black text-[#F1F5F9]">𝕏</span>;
      default:
        return <Share2 className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] flex items-center justify-center gap-3 text-xs font-mono text-[#94A3B8]">
        <RefreshCw className="w-4 h-4 animate-spin text-[#00C9A7]" />
        <span>Loading distribution channel controls...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {notification && (
          <div className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-[#00C9A7]/15 border border-[#00C9A7]/30 text-[#00C9A7] flex items-center gap-2 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
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
                    ? "bg-[#161D26] border-[#00C9A7]/40 shadow-sm shadow-[#00C9A7]/5"
                    : "bg-[#0A0E14] border-[#1F2D3D] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center shrink-0">
                      {getPlatformIcon(ch.platform)}
                    </div>
                    <span className="text-xs font-bold text-[#F1F5F9] truncate">{ch.name.split(" ")[0]}</span>
                  </div>
                  {/* Micro toggle indicator */}
                  <div
                    className={`w-6 h-3.5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                      isActive ? "bg-[#00C9A7] justify-end" : "bg-[#1F2D3D] justify-start"
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? "bg-[#00C9A7]" : "bg-[#64748B]"
                    }`}
                  />
                  <span className={isActive ? "text-[#00C9A7] font-semibold" : "text-[#64748B]"}>
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
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00C9A7] uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Omnichannel Broadcast Controls</span>
          </div>
          <h2 className="text-lg font-bold text-[#F1F5F9]">
            Automated Distribution Channels
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5 max-w-2xl">
            Toggle automated broadcasting per platform. Paused channels will be skipped during approval so posts only publish to active destinations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/docs?tab=webhooks"
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30 hover:bg-[#00C9A7]/20 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3 h-3" />
            <span>Setup Guides</span>
          </Link>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#161D26] border border-[#1F2D3D] text-[#94A3B8]">
            {channels.filter((c) => c.is_active).length}/{channels.length} Channels Active
          </span>
        </div>
      </div>

      {notification && (
        <div className="text-xs font-mono px-4 py-2 rounded-xl bg-[#00C9A7]/15 border border-[#00C9A7]/30 text-[#00C9A7] flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
            <span>{notification}</span>
          </div>
          <span className="text-[10px] text-[#00C9A7]/70 font-mono">Changes saved</span>
        </div>
      )}

      {/* Grid of 4 Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {channels.map((ch) => {
          const isActive = ch.is_active;
          const isBusy = updatingKey === ch.key;

          return (
            <div
              key={ch.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 relative ${
                isActive
                  ? "bg-[#161D26]/70 border-[#00C9A7]/30 shadow-sm"
                  : "bg-[#0B0F14] border-[#1F2D3D] opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#070B0F] border border-[#1F2D3D] flex items-center justify-center shrink-0 shadow-inner">
                    {getPlatformIcon(ch.platform)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#F1F5F9] truncate">{ch.name}</span>
                      {ch.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D]">
                          {ch.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#64748B] truncate mt-0.5">
                      {ch.target_destination}
                    </div>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(ch)}
                  disabled={isBusy}
                  aria-label={`Toggle ${ch.name}`}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer shrink-0 ${
                    isActive ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"
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
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {ch.description}
              </p>

              {/* Footer Status Pill */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#1F2D3D]/40">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? "bg-[#00C9A7] animate-pulse" : "bg-[#64748B]"
                    }`}
                  />
                  <span className={isActive ? "text-[#00C9A7] font-semibold" : "text-[#64748B]"}>
                    {isActive ? "Broadcasting Active" : "Broadcast Paused"}
                  </span>
                </div>
                <span className="text-[#64748B] text-[10px]">
                  {isActive ? "Auto-Posts on Publish" : "Skipped on Publish"}
                </span>
              </div>

              {/* Credential connection. Blog defaults to our own hosted blogs
                  table when nothing is connected — a webhook here redirects
                  publishing to the tenant's own site instead. */}
              <div className="pt-2 border-t border-[#1F2D3D]/40">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono ${ch.has_credential ? "text-[#00C9A7]" : "text-[#64748B]"}`}
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
