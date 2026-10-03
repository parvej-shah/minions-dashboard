"use client";

import { useState } from "react";
import { Hash, Loader2, Mic, Sparkles, Users2 } from "lucide-react";
import type { BrandDirectiveItem, BrandCategory, BrandSettings, IcpProfileItem } from "@/types";
import { useApiResource } from "@/hooks/useApiResource";
import { useDirectiveActions } from "@/hooks/useDirectiveActions";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { createDirective } from "@/lib/directivesClient";
import { LoadingState } from "@/components/ui/EmptyState";
import { sectionCardClass } from "@/components/ui/fieldStyles";
import CoverAppearanceCard from "@/components/brand/CoverAppearanceCard";
import PositioningCard from "@/components/brand/PositioningCard";
import TagList from "@/components/brand/TagList";

const TONE_LABELS: Record<string, string> = {
  technical_direct: "Technical & Direct",
  tactile_operator: "Tactile Operator",
  conversational_peer: "Conversational Peer",
};

interface OverviewTabProps {
  directives: BrandDirectiveItem[];
  setDirectives: React.Dispatch<React.SetStateAction<BrandDirectiveItem[]>>;
  /** Opens the Audience & Experience tab, where the ICP is edited. */
  onEditAudience: () => void;
}

/**
 * Plain-language default view of Brand Studio: four cards (Positioning / Topics
 * / Audience / Voice), one per non-FORBIDDEN BrandCategory, backed by the
 * exact same BrandDirective rows the Advanced Directives tab and the
 * drafting pipeline (/api/brand/context) read -- this is a presentation
 * layer over that data, not a separate store.
 */
export default function OverviewTab({ directives, setDirectives, onEditAudience }: OverviewTabProps) {
  const { data: icp } = useApiResource<IcpProfileItem | null>("/api/brand/icp", null, {
    errorMessage: "Could not load your ideal customer",
  });
  const {
    data: profile,
    isLoading: profileLoading,
    setData: setProfile,
  } = useApiResource<BrandSettings | null>("/api/brand", null, {
    errorMessage: "Could not load brand profile",
  });

  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const activeByCategory = (cat: BrandCategory) => directives.filter((d) => d.category === cat && d.is_active);

  const directiveActions = useDirectiveActions(directives, setDirectives);

  const regenerateWithAI = async () => {
    if (!profile) return;
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await apiClient.post<{
        success: boolean;
        positioningSummary?: string;
        directives?: { category: BrandCategory; rule_key: string; instruction: string; priority: number }[];
      }>("/api/onboarding/brand-copilot", {
        industry: profile.brand_name,
        businessName: profile.brand_name,
        differentiatorAnswer: activeByCategory("POSITIONING").map((d) => d.content).join(" "),
        mythAnswer: activeByCategory("VOICE").map((d) => d.content).join(" "),
        avoidAnswer: activeByCategory("FORBIDDEN").map((d) => d.content).join(" "),
      });

      if (res.directives?.length) {
        for (const dir of res.directives) {
          const created = await createDirective({ category: dir.category, key: dir.rule_key, content: dir.instruction, priority: dir.priority });
          setDirectives((prev) => [created, ...prev]);
        }
      }

      if (res.positioningSummary) {
        const updated = await apiClient.post<BrandSettings>("/api/brand", {
          ...toProfileInput(profile),
          positioning: res.positioningSummary,
        });
        setProfile(updated);
      }
    } catch (err) {
      setRegenError(toErrorMessage(err, "Could not regenerate with AI"));
    } finally {
      setRegenerating(false);
    }
  };

  if (profileLoading) return <LoadingState label="Loading your brand…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-line">
        <p className="text-sm leading-relaxed text-muted max-w-xl">
          This is what the AI knows about your brand. Edit anything below, or let AI refresh it for you.
        </p>
        <button
          type="button"
          onClick={regenerateWithAI}
          disabled={regenerating || !profile}
          className="flex items-center gap-1.5 bg-surface-2 hover:bg-[#1E293B] border border-brand/40 text-brand text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Regenerate with AI
        </button>
      </div>

      {regenError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-400">{regenError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PositioningCard
          profile={profile}
          setProfile={setProfile}
          items={activeByCategory("POSITIONING")}
          onAdd={directiveActions.add}
          onRemove={directiveActions.remove}
        />

        {/* Topics */}
        <div className={sectionCardClass}>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">Topics</h3>
          </div>
          <p className="text-sm text-muted">What you post about.</p>
          <TagList
            category="TOPICS"
            items={activeByCategory("TOPICS")}
            onAdd={directiveActions.add}
            onRemove={directiveActions.remove}
            placeholder="Add a topic (e.g. Voice AI)…"
          />
        </div>

        {/* Audience */}
        <div className={sectionCardClass}>
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">Audience</h3>
          </div>
          <p className="text-sm text-muted">The one customer every idea is written for.</p>
          {/* The ICP profile is the source of truth; the AUDIENCE directive
              the prompts read is derived from it on save. */}
          {icp?.who ? (
            <div className="space-y-1.5">
              <p className="text-sm text-ink line-clamp-3">{icp.who}</p>
              {icp.pains.length > 0 && (
                <p className="text-xs text-muted line-clamp-2">Biggest problem: {icp.pains[0]}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-subtle">Not described yet.</p>
          )}
          <button
            type="button"
            onClick={onEditAudience}
            className="text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            {icp?.who ? "Edit ideal customer" : "Describe your ideal customer"}
          </button>
        </div>

        {/* Voice */}
        <div className={sectionCardClass}>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">Voice</h3>
          </div>
          {profile && (
            <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/30 text-brand">
              {TONE_LABELS[profile.tone_guidelines.formality] || profile.tone_guidelines.formality}
            </span>
          )}
          <TagList
            category="VOICE"
            items={activeByCategory("VOICE")}
            onAdd={directiveActions.add}
            onRemove={directiveActions.remove}
            placeholder="Add a voice rule (e.g. no corporate jargon)…"
          />
        </div>

        <CoverAppearanceCard profile={profile} setProfile={setProfile} />
      </div>
    </div>
  );
}
