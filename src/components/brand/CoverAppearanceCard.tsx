"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { BrandProfileInput, BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { COVER_ART_STYLES, COVER_ART_STYLE_META } from "@/lib/covers/artStyles";
import { Button, buttonStyles } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/fieldStyles";
import { BrandCard, brandText } from "@/components/brand/parts";
import BrandLookPreview from "@/components/brand/BrandLookPreview";

// Ordered and labeled by each colour's role on a cover (src/lib/covers):
// the paper, the text, the accent word and quote mark, the big number and the
// initials badge. accent_blue belonged to the removed AI image covers: still
// saved untouched, no longer shown.
const LOOK_COLOR_FIELDS: { key: "primary_ink" | "brand_teal" | "brand_coral" | "brand_cream" | "accent_blue"; label: string }[] = [
  { key: "brand_cream", label: "Paper" },
  { key: "primary_ink", label: "Text" },
  { key: "brand_coral", label: "Accent word" },
  { key: "brand_teal", label: "Number & initials" },
];

type LookDraft = Pick<
  BrandProfileInput,
  "primary_logo_url" | "primary_ink" | "brand_teal" | "brand_coral" | "brand_cream" | "accent_blue"
> & { cover_byline: string; cover_art: string; cover_cutout_url: string };

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
}

/** Photo, colours and illustration style of the generated covers. The full editor behind the cover card on Your brand. */
export default function CoverAppearanceCard({ profile, setProfile }: Props) {
  // null means "no unsaved changes": the fields show the saved profile and are always editable.
  const [changes, setChanges] = useState<LookDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lookDraft = changes ?? (profile ? fromProfile(profile) : null);
  const setLookDraft = (d: LookDraft) => setChanges(d);
  const dirty = changes !== null;

  const save = async () => {
    if (!profile || !changes) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        ...changes,
      });
      setProfile(updated);
      setChanges(null);
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
    if (!file || !profile) return;
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
      setChanges((d) => ({ ...(d ?? fromProfile(profile)), primary_logo_url: body.url! }));
    } catch (e) {
      setPhotoError(toErrorMessage(e, "Upload failed"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [uploadingCutout, setUploadingCutout] = useState(false);
  const [cutoutError, setCutoutError] = useState<string | null>(null);

  /** Uploads a cut-out of the author for the Cut-out cover, after checking it really has a see-through background. */
  const uploadCutout = async (file: File | undefined) => {
    if (!file || !profile) return;
    setCutoutError(null);
    if (file.type !== "image/png") return setCutoutError("Use a PNG with a transparent background.");
    if (file.size > 5 * 1024 * 1024) return setCutoutError("Use an image under 5 MB.");
    if (!(await hasClearCorners(file))) return setCutoutError("This photo has a background. Remove it first (any background remover works), then upload the PNG.");
    setUploadingCutout(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
      setChanges((d) => ({ ...(d ?? fromProfile(profile)), cover_cutout_url: body.url! }));
    } catch (e) {
      setCutoutError(toErrorMessage(e, "Upload failed"));
    } finally {
      setUploadingCutout(false);
    }
  };

  const fileButton = (busy: boolean) => `${buttonStyles({ variant: "secondary" })} shrink-0 ${busy ? "pointer-events-none opacity-50" : ""}`;

  return (
    <BrandCard
      title="Cover look"
      line="Your photo, colours and illustration style on new covers."
    >
      {lookDraft ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="cover-photo" className={brandText.label}>Photo or logo</label>
            <div className="flex gap-2">
              <input id="cover-photo" type="text" value={lookDraft.primary_logo_url} onChange={(e) => setLookDraft({ ...lookDraft, primary_logo_url: e.target.value })} placeholder="https://… (PNG or JPEG)" className={`${inputClass} min-w-0 flex-1`} />
              <label className={fileButton(uploadingPhoto)}>
                {uploadingPhoto && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Upload
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => void uploadPhoto(e.target.files?.[0])} />
              </label>
            </div>
            <p className={brandText.note}>A headshot builds personal authority.</p>
            {photoError && <p role="alert" className="text-sm text-danger">{photoError}</p>}
          </div>
          <div className="space-y-2">
            <p className={brandText.label}>Cut-out photo</p>
            <div className="flex flex-wrap items-center gap-3">
              {lookDraft.cover_cutout_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lookDraft.cover_cutout_url} alt="Your cut-out photo" className="h-14 w-14 shrink-0 rounded-xl bg-[repeating-conic-gradient(#8883_0_25%,transparent_0_50%)] bg-[length:12px_12px] object-contain" />
              )}
              <label className={fileButton(uploadingCutout)}>
                {uploadingCutout && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {lookDraft.cover_cutout_url ? "Replace" : "Upload"}
                <input type="file" accept="image/png" className="hidden" onChange={(e) => void uploadCutout(e.target.files?.[0])} />
              </label>
              {lookDraft.cover_cutout_url && (
                <Button variant="ghost" onClick={() => setLookDraft({ ...lookDraft, cover_cutout_url: "" })}>Remove</Button>
              )}
            </div>
            <p className={brandText.note}>A PNG of you with the background removed. The Cut-out cover is off until you add one.</p>
            {cutoutError && <p role="alert" className="text-sm text-danger">{cutoutError}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="cover-byline" className={brandText.label}>Line under your name</label>
            <input id="cover-byline" type="text" value={lookDraft.cover_byline} maxLength={90} onChange={(e) => setLookDraft({ ...lookDraft, cover_byline: e.target.value })} placeholder="e.g. Builds AI voice agents for real estate teams" className={inputClass} />
            <p className={brandText.note}>Left empty, covers use the first sentence of what you do.</p>
          </div>
          <div className="space-y-2">
            <p className={brandText.label}>Illustration above the headline</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {COVER_ART_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={lookDraft.cover_art === s}
                  onClick={() => setLookDraft({ ...lookDraft, cover_art: s })}
                  className={`cursor-pointer rounded-2xl p-4 text-left ${lookDraft.cover_art === s ? "bg-brand/5 ring-1 ring-brand" : "bg-surface-2 hover:bg-surface-3"}`}
                >
                  <span className="block text-[15px] font-medium text-ink">{COVER_ART_STYLE_META[s].label}</span>
                  <span className="block text-sm text-muted">{COVER_ART_STYLE_META[s].description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className={brandText.label}>Custom colours</p>
            <p className={brandText.note}>Tap a colour to change it. Or pick a ready theme on Your brand.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LOOK_COLOR_FIELDS.map(({ key, label }) => (
                <label key={key} className="block cursor-pointer space-y-1.5">
                  <span className="relative block h-12 overflow-hidden rounded-2xl ring-1 ring-line" style={{ backgroundColor: lookDraft[key] }}>
                    <input type="color" value={lookDraft[key]} onChange={(e) => setLookDraft({ ...lookDraft, [key]: e.target.value.toUpperCase() })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </span>
                  <span className="block text-center text-sm text-muted">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <BrandLookPreview colors={lookDraft} brandName={profile?.brand_name} byline={lookDraft.cover_byline} logoUrl={lookDraft.primary_logo_url} art={lookDraft.cover_art} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          {dirty && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setChanges(null); setError(null); }}>Cancel</Button>
              <Button onClick={save} loading={isSaving}>Save</Button>
            </div>
          )}
        </div>
      ) : null}
    </BrandCard>
  );
}

function fromProfile(p: BrandSettings): LookDraft {
  return {
    primary_logo_url: p.primary_logo_url,
    cover_byline: p.cover_byline,
    cover_art: p.cover_art,
    cover_cutout_url: p.cover_cutout_url,
    primary_ink: p.primary_ink,
    brand_teal: p.brand_teal,
    brand_coral: p.brand_coral,
    brand_cream: p.brand_cream,
    accent_blue: p.accent_blue,
  };
}

/** Whether a PNG's top corners are see-through, i.e. the person was cut out of their background. */
async function hasClearCorners(file: File): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(bitmap, 0, 0, 64, 64);
    const alpha = (x: number) => ctx.getImageData(x, 0, 1, 1).data[3];
    return alpha(0) <= 32 && alpha(63) <= 32;
  } catch {
    // The server checks again when it draws; don't block the upload on a browser quirk.
    return true;
  }
}
