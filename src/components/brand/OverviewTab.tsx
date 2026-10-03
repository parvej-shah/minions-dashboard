"use client";

import { useState } from "react";
import { User, Hash, Users2, Mic, Plus, X, Loader2, Pencil, Sparkles, Check, Palette, Upload, ChevronDown } from "lucide-react";
import type { BrandDirectiveItem, BrandCategory, BrandSettings, BrandProfileInput, IcpProfileItem } from "@/types";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";
import BrandLookPreview from "@/components/brand/BrandLookPreview";
import { COVER_ART_STYLES, COVER_ART_STYLE_META } from "@/lib/covers/artStyles";

import { buttonStyles } from "@/components/ui/Button";
const PER_CATEGORY_LIMIT = 6;

const TONE_LABELS: Record<string, string> = {
  technical_direct: "Technical & Direct",
  tactile_operator: "Tactile Operator",
  conversational_peer: "Conversational Peer",
};

// Ordered and labeled by each colour's role on a cover (src/lib/covers):
// the paper, the text, the accent word and quote mark, the big number and the
// initials badge. accent_blue is only used by the older AI image covers.
const LOOK_COLOR_FIELDS: { key: "primary_ink" | "brand_teal" | "brand_coral" | "brand_cream" | "accent_blue"; label: string }[] = [
  { key: "brand_cream", label: "Paper" },
  { key: "primary_ink", label: "Text" },
  { key: "brand_coral", label: "Accent word" },
  { key: "brand_teal", label: "Number & initials" },
  { key: "accent_blue", label: "AI image icon" },
];

type LookDraft = Pick<
  BrandProfileInput,
  "primary_logo_url" | "primary_ink" | "brand_teal" | "brand_coral" | "brand_cream" | "accent_blue"
> & { cover_byline: string; cover_art: string };

function toProfileInput(settings: BrandSettings): BrandProfileInput {
  return {
    brand_name: settings.brand_name,
    company_domain: settings.company_domain,
    positioning: settings.positioning,
    primary_logo_url: settings.primary_logo_url,
    cover_byline: settings.cover_byline,
    cover_art: settings.cover_art,
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

  const [editingPositioning, setEditingPositioning] = useState(false);
  const [positioningDraft, setPositioningDraft] = useState("");
  // Edited alongside positioning: brand_name is what every generated cover
  // image prints, and tenants created before onboarding sent a real name are
  // stuck showing "<email-local-part>'s Workspace" until they can change it.
  const [brandNameDraft, setBrandNameDraft] = useState("");
  const [savingPositioning, setSavingPositioning] = useState(false);
  const [positioningError, setPositioningError] = useState<string | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const [editingLook, setEditingLook] = useState(false);
  const [lookDraft, setLookDraft] = useState<LookDraft | null>(null);
  const [savingLook, setSavingLook] = useState(false);
  const [lookError, setLookError] = useState<string | null>(null);

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
    const res = await fetch("/api/brand/directives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, key, content, priority: 1, audience_scope: "ALL" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Could not add that — please try again.");
    }
    const created: BrandDirectiveItem = await res.json();
    setDirectives((prev) => [created, ...prev]);
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
    setPositioningError(null);
    setPositioningDraft(profile.positioning);
    setBrandNameDraft(profile.brand_name);
    setEditingPositioning(true);
  };

  const savePositioning = async () => {
    if (!profile) return;
    setSavingPositioning(true);
    setPositioningError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        brand_name: brandNameDraft.trim() || profile.brand_name,
        positioning: positioningDraft,
      });
      setProfile(updated);
      setEditingPositioning(false);
    } catch (error) {
      setPositioningError(toErrorMessage(error, "Could not save your brand basics."));
    } finally {
      setSavingPositioning(false);
    }
  };

  const openLookEdit = () => {
    if (!profile) return;
    setLookError(null);
    setLookDraft({
      primary_logo_url: profile.primary_logo_url,
      cover_byline: profile.cover_byline,
      cover_art: profile.cover_art,
      primary_ink: profile.primary_ink,
      brand_teal: profile.brand_teal,
      brand_coral: profile.brand_coral,
      brand_cream: profile.brand_cream,
      accent_blue: profile.accent_blue,
    });
    setEditingLook(true);
  };

  const saveLook = async () => {
    if (!profile || !lookDraft) return;
    setSavingLook(true);
    setLookError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        ...lookDraft,
      });
      setProfile(updated);
      setEditingLook(false);
    } catch (error) {
      setLookError(toErrorMessage(error, "Could not save your cover appearance."));
    } finally {
      setSavingLook(false);
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  /** Uploads a headshot or logo to our storage; covers use it from the next draft on. */
  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !lookDraft) return;
    setPhotoError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) return setPhotoError("Use a PNG or JPEG image.");
    if (file.size > 5 * 1024 * 1024) return setPhotoError("Use an image under 5 MB.");
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
      setLookDraft((d) => (d ? { ...d, primary_logo_url: body.url! } : d));
    } catch (e) {
      setPhotoError(toErrorMessage(e, "Upload failed"));
    } finally {
      setUploadingPhoto(false);
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
        {/* Positioning */}
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-ink">Positioning</h3>
            </div>
            {!editingPositioning && (
              <button type="button" onClick={openPositioningEdit} className="min-h-10 min-w-10 cursor-pointer rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-brand" aria-label="Edit business name and positioning">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editingPositioning ? (
            <div className="space-y-2">
              <div>
                <label htmlFor="brand-name" className="mb-1 block text-xs font-semibold text-muted">
                  Business name
                </label>
                <input
                  id="brand-name"
                  type="text"
                  value={brandNameDraft}
                  onChange={(e) => setBrandNameDraft(e.target.value)}
                  placeholder="e.g. Acme HVAC"
                  className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10px] text-subtle">
                  Shown on generated cover images and used throughout your content.
                </p>
              </div>
              <label htmlFor="brand-positioning" className="block text-xs font-semibold text-muted">What you do and for whom</label>
              <textarea
                id="brand-positioning"
                rows={3}
                value={positioningDraft}
                onChange={(e) => setPositioningDraft(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl p-3 text-xs text-ink resize-none focus:outline-none focus:border-brand"
              />
              {positioningError && <p role="alert" className="text-xs text-red-400">{positioningError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingPositioning(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={savePositioning}
                  disabled={savingPositioning}
                  className={buttonStyles({ size: "sm" })}
                >
                  {savingPositioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">
                {profile?.brand_name || "Unnamed brand"}
              </p>
              <p className="text-sm text-ink leading-relaxed">
                {profile?.positioning || "Not set yet — tap edit to describe who you are."}
              </p>
            </div>
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
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">Topics</h3>
          </div>
          <p className="text-sm text-muted">What you post about.</p>
          <TagList
            category="TOPICS"
            items={activeByCategory("TOPICS")}
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add a topic (e.g. Voice AI)…"
          />
        </div>

        {/* Audience */}
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
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
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 shadow-sm">
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
            onAdd={addToCategory}
            onRemove={removeDirective}
            placeholder="Add a voice rule (e.g. no corporate jargon)…"
          />
        </div>

        {/* Visual identity is useful but less frequently changed than the brand brief. */}
        <details className="group rounded-2xl border border-line bg-surface shadow-sm md:col-span-2">
          <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand"><Palette className="h-4 w-4" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-ink">Cover appearance</span><span className="mt-0.5 block text-xs text-muted">Photo, colors, and illustration style</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-3 border-t border-line/70 p-4 sm:p-5">
            {!editingLook && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">Your saved colors, photo, and illustration style.</p>
                <button type="button" onClick={openLookEdit} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border-2 border-line bg-surface-2 px-3 text-xs font-semibold text-ink transition-colors hover:border-brand/50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit cover appearance
                </button>
              </div>
            )}
            {editingLook && lookDraft ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">Photo or logo on covers (a headshot builds personal authority)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lookDraft.primary_logo_url}
                    onChange={(e) => setLookDraft({ ...lookDraft, primary_logo_url: e.target.value })}
                    placeholder="https://… (PNG or JPEG)"
                    className="flex-1 min-w-0 bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                  />
                  <label className={`shrink-0 px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs text-brand hover:border-brand cursor-pointer inline-flex items-center gap-1.5 ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => void uploadPhoto(e.target.files?.[0])} />
                  </label>
                </div>
                {photoError && <p className="text-[11px] text-[#F87171] mt-1">{photoError}</p>}
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">Byline under your name (empty: the first sentence of your positioning)</label>
                <input
                  type="text"
                  value={lookDraft.cover_byline}
                  maxLength={90}
                  onChange={(e) => setLookDraft({ ...lookDraft, cover_byline: e.target.value })}
                  placeholder="e.g. Builds AI voice agents for real estate teams"
                  className="w-full bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">Illustration above the headline</label>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_ART_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={lookDraft.cover_art === s}
                      onClick={() => setLookDraft({ ...lookDraft, cover_art: s })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all text-left ${
                        lookDraft.cover_art === s ? "bg-brand/15 border-brand text-brand" : "bg-surface-2 border-line text-ink hover:border-brand/60"
                      }`}
                    >
                      <span className="font-medium">{COVER_ART_STYLE_META[s].label}</span>
                      <span className="block text-[10px] text-subtle">{COVER_ART_STYLE_META[s].description}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-subtle mt-1">Used on new covers. To change a draft&apos;s cover, use its cover card in Editorial.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {LOOK_COLOR_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label
                      className="h-10 rounded-lg border border-line block cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: lookDraft[key] }}
                    >
                      <input
                        type="color"
                        value={lookDraft[key]}
                        onChange={(e) => setLookDraft({ ...lookDraft, [key]: e.target.value.toUpperCase() })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="text-[10px] text-subtle text-center">{label}</div>
                  </div>
                ))}
              </div>
              <BrandLookPreview colors={lookDraft} brandName={profile?.brand_name} byline={lookDraft.cover_byline} logoUrl={lookDraft.primary_logo_url} art={lookDraft.cover_art} />
              {lookError && <p role="alert" className="text-xs text-red-400">{lookError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingLook(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={saveLook}
                  disabled={savingLook}
                  className={buttonStyles({ size: "sm" })}
                >
                  {savingLook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
            {profile && <BrandLookPreview colors={profile} brandName={profile.brand_name} byline={profile.cover_byline} logoUrl={profile.primary_logo_url} art={profile.cover_art} />}
            <div className="flex flex-wrap items-center gap-2">
              {profile &&
                LOOK_COLOR_FIELDS.map(({ key, label }) => (
                  <span
                    key={key}
                    className="w-8 h-8 rounded-lg border border-line"
                    style={{ backgroundColor: profile[key] }}
                    title={`${label}: ${profile[key]}`}
                  />
                ))}
              {profile?.primary_logo_url && (
                <span className="text-[11px] text-muted font-mono ml-2 truncate max-w-[240px]">
                  {profile.primary_logo_url}
                </span>
              )}
              {profile && !profile.primary_logo_url && (
                <span className="text-[11px] text-subtle ml-2">No photo or logo yet: covers show your initials.</span>
              )}
            </div>
            </div>
          )}
          </div>
        </details>
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
  const [error, setError] = useState<string | null>(null);
  const isFull = items.length >= PER_CATEGORY_LIMIT;

  const submit = async () => {
    if (!draft.trim() || isFull) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(category, draft);
      setDraft("");
    } catch (err) {
      setError(toErrorMessage(err, "Could not add that — please try again."));
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
            className="inline-flex items-center gap-1.5 bg-surface-2 border border-line text-ink text-[11px] px-3 py-1.5 rounded-lg leading-relaxed"
          >
            {item.content}
            <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.content}`} className="min-h-7 min-w-7 cursor-pointer text-subtle hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          aria-label={placeholder}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
          disabled={isFull}
          placeholder={isFull ? `Limit reached (${PER_CATEGORY_LIMIT})` : placeholder}
          className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          aria-label="Add item"
          disabled={submitting || isFull || !draft.trim()}
          className="flex items-center gap-1 bg-surface-2 hover:bg-line border border-line text-muted hover:text-ink text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
