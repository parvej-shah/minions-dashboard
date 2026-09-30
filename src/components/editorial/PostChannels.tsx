"use client";

import React from "react";
import { Check } from "lucide-react";
import { POST_CHANNELS, POST_CHANNEL_LABEL, postGoesTo, type PostChannel } from "@/constants/postChannels";
import type { DistributionChannelKey } from "@/types";

export interface PostChannelsProps {
  /** The post's own override; empty follows the workspace. */
  override: string[];
  /** The workspace's channel switches; null while loading. */
  workspace: Record<DistributionChannelKey, boolean> | null;
  disabled: boolean;
  onChange: (channels: string[] | null) => void;
  onMessage: (m: string) => void;
}

/**
 * Where this one post goes (plan decision D18). Only the workspace's active
 * channels are offered; turning one off keeps this post off it. Turning them
 * all back on returns the post to following the workspace.
 */
export default function PostChannels({ override, workspace, disabled, onChange, onMessage }: PostChannelsProps) {
  if (!workspace) return null;
  const offered = POST_CHANNELS.filter((c) => workspace[c]);
  if (offered.length < 2) return null; // nothing to choose between

  const on = offered.filter((c) => postGoesTo(override, c));
  const toggle = (c: PostChannel) => {
    const next = on.includes(c) ? on.filter((x) => x !== c) : [...on, c];
    if (next.length === 0) {
      onMessage("A post needs at least one channel. To not post it at all, leave it in review.");
      return;
    }
    onChange(next.length === offered.length ? null : POST_CHANNELS.filter((x) => next.includes(x)));
  };

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-medium text-muted block">Post to</span>
      <div className="flex flex-wrap gap-1.5">
        {offered.map((c) => {
          const active = on.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(c)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 cursor-pointer ${
                active ? "bg-brand/15 border-brand text-brand" : "bg-surface-2 border-line text-subtle line-through"
              }`}
            >
              {active && <Check className="w-3 h-3" />}
              {POST_CHANNEL_LABEL[c]}
            </button>
          );
        })}
      </div>
      {on.length < offered.length && <p className="text-[10px] text-subtle">Only this post. Other posts still go everywhere that&apos;s switched on.</p>}
    </div>
  );
}
