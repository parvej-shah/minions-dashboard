"use client";

import { useState } from "react";
import type { BrandCategory, BrandDirectiveItem, BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { createDirective } from "@/lib/directivesClient";
import { Button } from "@/components/ui/Button";
import { BrandCard, brandText } from "@/components/brand/parts";
import TagList from "@/components/brand/TagList";

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
  directives: BrandDirectiveItem[];
  setDirectives: React.Dispatch<React.SetStateAction<BrandDirectiveItem[]>>;
  onAdd: (category: BrandCategory, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/** The short voice rules every draft follows, with the occasional AI refresh under them. */
export default function VoiceRulesCard({ profile, setProfile, directives, setDirectives, onAdd, onRemove }: Props) {
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = (cat: BrandCategory) => directives.filter((d) => d.category === cat && d.is_active);

  // Rewrites "What you do" and adds rules from what is already here; nothing is removed.
  const refresh = async () => {
    if (!profile) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await apiClient.post<{
        positioningSummary?: string;
        directives?: { category: BrandCategory; rule_key: string; instruction: string; priority: number }[];
      }>("/api/onboarding/brand-copilot", {
        industry: profile.brand_name,
        businessName: profile.brand_name,
        differentiatorAnswer: active("POSITIONING").map((d) => d.content).join(" "),
        mythAnswer: active("VOICE").map((d) => d.content).join(" "),
        avoidAnswer: active("FORBIDDEN").map((d) => d.content).join(" "),
      });
      for (const dir of res.directives ?? []) {
        const created = await createDirective({ category: dir.category, key: dir.rule_key, content: dir.instruction, priority: dir.priority });
        setDirectives((prev) => [created, ...prev]);
      }
      if (res.positioningSummary) {
        setProfile(await apiClient.post<BrandSettings>("/api/brand", { ...toProfileInput(profile), positioning: res.positioningSummary }));
      }
    } catch (err) {
      setError(toErrorMessage(err, "Could not refresh with AI"));
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <BrandCard title="Voice rules" line="Short rules every draft follows.">
      <TagList rows category="VOICE" items={active("VOICE")} onAdd={onAdd} onRemove={onRemove} placeholder="e.g. No corporate jargon" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
        <p className={brandText.note}>Rewrites &ldquo;What you do&rdquo; and adds rules from what&apos;s here. Nothing is removed.</p>
        <Button variant="ghost" size="sm" onClick={refresh} loading={regenerating} disabled={!profile}>Refresh with AI</Button>
      </div>
    </BrandCard>
  );
}
