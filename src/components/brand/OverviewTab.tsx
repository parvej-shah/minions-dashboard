"use client";

import { useState } from "react";
import { User, Hash, Users2, Mic, Plus, X, Loader2, Pencil, Sparkles, Check } from "lucide-react";
import type { BrandDirectiveItem, BrandCategory, BrandSettings, BrandProfileInput } from "@/types";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";

const PER_CATEGORY_LIMIT = 6;

const TONE_LABELS: Record<string, string> = {
  technical_direct: "Technical & Direct",
  tactile_operator: "Tactile Operator",
  conversational_peer: "Conversational Peer",
};

function toProfileInput(settings: BrandSettings): BrandProfileInput {
  return {
    brand_name: settings.brand_name,
    company_domain: settings.company_domain,
    positioning: settings.positioning,
    primary_logo_url: settings.primary_logo_url,
    primary_ink: settings.primary_ink,
    brand_teal: settings.brand_teal,
    brand_coral: settings.brand_coral,
    brand_cream: settings.brand_cream,
    accent_blue: settings.accent_blue,
    tone_formality: settings.tone_guidelines.formality,
    tone_cadence: settings.tone_guidelines.cadence,
    allowed_proof_claims: settings.tone_guidelines.allowed_proof_claims,
  };
}

interface OverviewTabProps {
  directives: BrandDirectiveItem[];
  setDirectives: React.Dispatch<React.SetStateAction<BrandDirectiveItem[]>>;
}

/**
 * Plain-language default view of Brand Studio: four cards (About you / Topics
 * / Audience / Voice), one per non-FORBIDDEN BrandCategory, backed by the
 * exact same BrandDirective rows the Advanced Directives tab and the
 * drafting pipeline (/api/brand/context) read -- this is a presentation
 * layer over that data, not a separate store.
 */
export default function OverviewTab({ directives, setDirectives }: OverviewTabProps) {
  const {
    data: profile,
    isLoading: profileLoading,
    setData: setProfile,
  } = useApiResource<BrandSettings | null>("/api/brand", null, {
    errorMessage: "Could not load brand profile",
  });

  const [editingPositioning, setEditingPositioning] = useState(false);
  const [positioningDraft, setPositioningDraft] = useState("");
  const [savingPositioning, setSavingPositioning] = useState(false);

  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const activeByCategory = (cat: BrandCategory) => directives.filter((d) => d.category === cat && d.is_active);

  const addToCategory = async (cat: BrandCategory, text: string) => {
    const content = text.trim();
    if (!content) return;
    const key =
      content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join("_") || "directive_rule";
    try {
      const res = await fetch("/api/brand/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, key, content, priority: 1, audience_scope: "ALL" }),
      });
      if (res.ok) {
        const created: BrandDirectiveItem = await res.json();
        setDirectives((prev) => [created, ...prev]);
      }
    } catch {
      // No local fallback: a directive that only exists client-side would
      // silently never reach the pipeline's actual brand context query.
    }
  };

  const removeDirective = async (id: string) => {
    const previous = directives;
    setDirectives(directives.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/brand/directives/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setDirectives(previous);
    }
  };

  const openPositioningEdit = () => {
    if (!profile) return;
    setPositioningDraft(profile.positioning);
    setEditingPositioning(true);
  };

  const savePositioning = async () => {
    if (!profile) return;
    setSavingPositioning(true);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        positioning: positioningDraft,
      });
      setProfile(updated);
      setEditingPositioning(false);
    } finally {
      setSavingPositioning(false);
    }
  };

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
          const created = await fetch("/api/brand/directives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: dir.category,
              key: dir.rule_key,
              content: dir.instruction,
              priority: dir.priority,
              audience_scope: "ALL",
            }),
          }).then((r) => r.json());
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F1419] p-4 rounded-2xl border border-[#1F2D3D]">
        <p className="text-xs text-[#94A3B8] max-w-xl">
          This is what the AI knows about your brand. Edit anything below, or let AI refresh it for you.
        </p>
        <button
          type="button"
          onClick={regenerateWithAI}
          disabled={regenerating || !profile}
          className="flex items-center gap-1.5 bg-[#161D26] hover:bg-[#1E293B] border border-[#00C9A7]/40 text-[#00C9A7] text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Regenerate with AI
        </button>
      </div>

      {regenError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-400">{regenError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* About You */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#00C9A7]" />
              <h3 className="text-sm font-bold text-[#F1F5F9]">About you</h3>
            </div>
            {!editingPositioning && (
              <button onClick={openPositioningEdit} className="text-[#94A3B8] hover:text-[#00C9A7] p-1" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editingPositioning ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={positioningDraft}
                onChange={(e) => setPositioningDraft(e.target.value)}
                className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-3 text-xs text-[#F1F5F9] resize-none focus:outline-none focus:border-[#00C9A7]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingPositioning(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:bg-[#161D26]"
                >
                  Cancel
                </button>
                <button
                  onClick={savePositioning}
                  disabled={savingPositioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {savingPositioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#F1F5F9] leading-relaxed">
              {profile?.positioning || "Not set yet — tap edit to describe who you are."}
            </p>
          )}

          <TagList
            category="POSITIONING"
            items={activeByCategory("POSITIONING")}
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add a differentiator or identity note…"
          />
        </div>

        {/* Topics */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#00C9A7]" />
            <h3 className="text-sm font-bold text-[#F1F5F9]">Topics</h3>
          </div>
          <p className="text-xs text-[#94A3B8]">What you post about.</p>
          <TagList
            category="TOPICS"
            items={activeByCategory("TOPICS")}
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add a topic (e.g. Voice AI)…"
          />
        </div>

        {/* Audience */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-[#00C9A7]" />
            <h3 className="text-sm font-bold text-[#F1F5F9]">Audience</h3>
          </div>
          <p className="text-xs text-[#94A3B8]">Who you&apos;re trying to reach.</p>
          <TagList
            category="AUDIENCE"
            items={activeByCategory("AUDIENCE")}
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add an audience (e.g. Founders)…"
          />
        </div>

        {/* Voice */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#00C9A7]" />
            <h3 className="text-sm font-bold text-[#F1F5F9]">Voice</h3>
          </div>
          {profile && (
            <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#00C9A7]/10 border border-[#00C9A7]/30 text-[#00C9A7]">
              {TONE_LABELS[profile.tone_guidelines.formality] || profile.tone_guidelines.formality}
            </span>
          )}
          <TagList
            category="VOICE"
            items={activeByCategory("VOICE")}
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add a voice rule (e.g. no corporate jargon)…"
          />
        </div>
      </div>
    </div>
  );
}

function TagList({
  category,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  category: BrandCategory;
  items: BrandDirectiveItem[];
  onAdd: (category: BrandCategory, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFull = items.length >= PER_CATEGORY_LIMIT;

  const submit = async () => {
    if (!draft.trim() || isFull) return;
    setSubmitting(true);
    try {
      await onAdd(category, draft);
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 bg-[#161D26] border border-[#1F2D3D] text-[#F1F5F9] text-[11px] px-2.5 py-1 rounded-lg"
          >
            {item.content}
            <button onClick={() => onRemove(item.id)} className="text-[#64748B] hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
          disabled={isFull}
          placeholder={isFull ? `Limit reached (${PER_CATEGORY_LIMIT})` : placeholder}
          className="flex-1 bg-[#161D26] border border-[#1F2D3D] rounded-lg px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7] disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={submitting || isFull || !draft.trim()}
          className="flex items-center gap-1 bg-[#161D26] hover:bg-[#1F2D3D] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
