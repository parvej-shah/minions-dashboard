"use client";

import React from "react";
import { POST_CHANNELS, POST_CHANNEL_LABEL, postGoesTo } from "@/constants/postChannels";
import { toggleChannel } from "@/lib/drafts/postChannels";
import { GroupedList, ListRow, Switch } from "@/components/ui/List";
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
 * Where this one post goes (plan decision D18), as a grouped list with one
 * switch per channel. Only the workspace's active channels are offered;
 * turning one off keeps this post off it. Turning them all back on returns
 * the post to following the workspace.
 */
export default function PostChannels({ override, workspace, disabled, onChange, onMessage }: PostChannelsProps) {
  if (!workspace) return null;
  const offered = POST_CHANNELS.filter((c) => workspace[c]);
  if (offered.length < 2) return null; // nothing to choose between

  const on = offered.filter((c) => postGoesTo(override, c));

  return (
    <GroupedList
      aria-label="Post to"
      footer={on.length < offered.length ? "Only this post. Other posts still go everywhere that's switched on." : undefined}
    >
      {offered.map((c) => (
        <ListRow
          key={c}
          label={POST_CHANNEL_LABEL[c]}
          trailing={
            <Switch
              checked={on.includes(c)}
              label={POST_CHANNEL_LABEL[c]}
              disabled={disabled}
              onChange={() => {
                const r = toggleChannel(offered, on, c);
                if ("refused" in r) onMessage("A post needs at least one channel. To not post it at all, leave it in review.");
                else onChange(r.channels);
              }}
            />
          }
        />
      ))}
    </GroupedList>
  );
}
