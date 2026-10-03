"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Palette, Pencil, Upload } from "lucide-react";
import type { BrandProfileInput, BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { COVER_ART_STYLES, COVER_ART_STYLE_META } from "@/lib/covers/artStyles";
import { buttonStyles } from "@/components/ui/Button";
import BrandLookPreview from "@/components/brand/BrandLookPreview";

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

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
}

/** Photo, colors and illustration style of the generated covers; collapsed because it changes rarely. */
export default function CoverAppearanceCard({ profile, setProfile }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [lookDraft, setLookDraft] = useState<LookDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    if (!profile) return;
    setError(null);
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
    setIsEditing(true);
  };

  const save = async () => {
    if (!profile || !lookDraft) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        ...lookDraft,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(toErrorMessage(err, "Could not save your cover appearance."));
    } finally {
      setIsSaving(false);
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

  return (
    <details className="group rounded-2xl border border-line bg-surface shadow-sm md:col-span-2">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand"><Palette className="h-4 w-4" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-ink">Cover appearance</span><span className="mt-0.5 block text-xs text-muted">Photo, colors, and illustration style</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-line/70 p-4 sm:p-5">
        {!isEditing && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Your saved colors, photo, and illustration style.</p>
            <button type="button" onClick={openEdit} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border-2 border-line bg-surface-2 px-3 text-xs font-semibold text-ink transition-colors hover:border-brand/50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit cover appearance
            </button>
          </div>
        )}
        {isEditing && lookDraft ? (
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
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className={buttonStyles({ size: "sm" })}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
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
  );
}
