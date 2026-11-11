"use client";

import { useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import type { BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { COVER_THEMES, themeColours, themeOf, type CoverTheme } from "@/lib/covers/themes";
import { buttonStyles } from "@/components/ui/Button";
import { validateCoverPhoto, updatePhotoPayload } from "@/lib/brand/photoUpload";
import ErrorLine from "@/components/ui/ErrorLine";
import { LoadingState } from "@/components/ui/EmptyState";
import { BrandCard, brandText } from "@/components/brand/parts";
import BrandLookPreview from "@/components/brand/BrandLookPreview";

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
  /** Opens the full editor: photo, cut-out, byline, illustration, custom colours. */
  onEdit: () => void;
}

/**
 * The cover look on the Brand basics: a real sample cover and the ready-made
 * themes. One tap saves a theme; everything finer is on the Cover look page.
 */
export default function CoverThemeCard({ profile, setProfile, onEdit }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const title = "Cover look";
  const line = "The image on top of every post. Pick a theme.";

  if (!profile) return <BrandCard title={title} line={line}><LoadingState rows={1} /></BrandCard>;
  const current = themeOf(profile);

  const pick = async (theme: CoverTheme) => {
    if (theme.id === current?.id || saving) return;
    setSaving(theme.id);
    setError(null);
    try {
      setProfile(await apiClient.post<BrandSettings>("/api/brand", { ...toProfileInput(profile), ...themeColours(theme) }));
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't change the theme."));
    } finally {
      setSaving(null);
    }
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!file || !profile) return;
    setPhotoError(null);
    const err = validateCoverPhoto(file);
    if (err) {
      setPhotoError(err);
      return;
    }
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
      }
      const updated = await apiClient.post<BrandSettings>("/api/brand", updatePhotoPayload(profile, body.url));
      setProfile(updated);
    } catch (e) {
      setPhotoError(toErrorMessage(e, "Upload failed."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!profile || !profile.primary_logo_url || uploadingPhoto) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", updatePhotoPayload(profile, ""));
      setProfile(updated);
    } catch (e) {
      setPhotoError(toErrorMessage(e, "Could not remove photo."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <BrandCard title={title} line={line} action={<button type="button" onClick={onEdit} className={brandText.link}>Photo and more</button>}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="w-[200px] max-w-full shrink-0 space-y-2.5">
          <BrandLookPreview bare colors={profile} brandName={profile.brand_name} byline={profile.cover_byline} logoUrl={profile.primary_logo_url} art={profile.cover_art} />
          <div className="space-y-1.5">
            <label
              className={`${buttonStyles({ variant: "secondary", size: "sm", block: true })} cursor-pointer ${uploadingPhoto ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-hidden="true" />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <span>{profile.primary_logo_url ? "Change photo" : "Upload photo"}</span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => {
                  void uploadPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {profile.primary_logo_url && !uploadingPhoto && (
              <button
                type="button"
                onClick={() => void removePhoto()}
                className="w-full text-center text-[13px] text-subtle hover:text-danger hover:underline cursor-pointer transition-colors"
              >
                Remove photo
              </button>
            )}
            {photoError && <ErrorLine text={photoError} />}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <ul role="radiogroup" aria-label="Cover theme" className="grid grid-cols-3 gap-3">
            {COVER_THEMES.map((t) => {
              const on = t.id === current?.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => void pick(t)}
                    className={`w-full cursor-pointer rounded-2xl p-1.5 text-left focus-visible:outline-2 focus-visible:outline-brand ${on ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-subtle"}`}
                  >
                    <ThemeSwatch theme={t} />
                    <span className="flex items-center justify-between gap-1 px-1.5 pb-0.5 pt-2 text-[15px] text-ink">
                      {t.label}
                      {saving === t.id ? <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" /> : on && <Check className="h-4 w-4" aria-hidden="true" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!current && <p className={brandText.note}>You use custom colours. Change them under Photo and more.</p>}
          {error && <ErrorLine text={error} />}
        </div>
      </div>
    </BrandCard>
  );
}

/** A tiny cover in the theme's colours: paper, two lines of headline with one accent word, the initials dot. */
function ThemeSwatch({ theme }: { theme: CoverTheme }) {
  return (
    <span aria-hidden="true" className="flex aspect-[4/3] flex-col justify-between rounded-xl p-2.5" style={{ backgroundColor: theme.brand_cream }}>
      <span className="space-y-1">
        <span className="block h-1.5 w-4/5 rounded-full" style={{ backgroundColor: theme.primary_ink }} />
        <span className="flex gap-1">
          <span className="block h-1.5 w-1/3 rounded-full" style={{ backgroundColor: theme.primary_ink }} />
          <span className="block h-1.5 w-1/4 rounded-full" style={{ backgroundColor: theme.brand_coral }} />
        </span>
      </span>
      <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.brand_teal }} />
    </span>
  );
}
