"use client";

import { useEffect, useState } from "react";
import { Camera, Check, Loader2, Scissors } from "lucide-react";
import type { BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { COVER_THEMES, themeColours, themeOf, type CoverTheme } from "@/lib/covers/themes";
import { buttonStyles } from "@/components/ui/Button";
import {
  validateCoverPhoto,
  updatePhotoPayload,
  validateCutoutPhoto,
  updateCutoutPayload,
  hasClearCorners,
} from "@/lib/brand/photoUpload";
import ErrorLine from "@/components/ui/ErrorLine";
import { LoadingState } from "@/components/ui/EmptyState";
import { BrandCard, brandText } from "@/components/brand/parts";
import BrandLookPreview from "@/components/brand/BrandLookPreview";

interface FontSample {
  id: string;
  label: string;
  about: string;
  svg: string;
}

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
  /** Opens the custom colours editor. */
  onEdit: () => void;
}

/**
 * The cover look on the Brand basics: a real sample cover and ready-made
 * themes. Founders can directly upload their square headshot and cut-out photo,
 * or jump to custom colours.
 */
export default function CoverThemeCard({ profile, setProfile, onEdit }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [uploadingCutout, setUploadingCutout] = useState(false);
  const [cutoutError, setCutoutError] = useState<string | null>(null);

  const [fonts, setFonts] = useState<FontSample[]>([]);
  const [fontSaving, setFontSaving] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    apiClient
      .get<{ fonts: FontSample[] }>("/api/brand/cover-font")
      .then((r) => live && setFonts(r.fonts))
      .catch(() => live && setFonts([]));
    return () => {
      live = false;
    };
  }, []);

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

  const font = profile.cover_font || "bricolage";
  const pickFont = async (id: string) => {
    if (id === font || fontSaving) return;
    setFontSaving(id);
    setError(null);
    try {
      await apiClient.patch("/api/brand/cover-font", { font: id });
      setProfile({ ...profile, cover_font: id });
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't change the font."));
    } finally {
      setFontSaving(null);
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

  const uploadCutout = async (file: File | undefined) => {
    if (!file || !profile) return;
    setCutoutError(null);
    const err = validateCutoutPhoto(file);
    if (err) {
      setCutoutError(err);
      return;
    }
    if (!(await hasClearCorners(file))) {
      setCutoutError("This photo has a background. Remove it first, then upload the PNG.");
      return;
    }
    setUploadingCutout(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
      }
      const updated = await apiClient.post<BrandSettings>("/api/brand", updateCutoutPayload(profile, body.url));
      setProfile(updated);
    } catch (e) {
      setCutoutError(toErrorMessage(e, "Upload failed."));
    } finally {
      setUploadingCutout(false);
    }
  };

  const removeCutout = async () => {
    if (!profile || !profile.cover_cutout_url || uploadingCutout) return;
    setCutoutError(null);
    setUploadingCutout(true);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", updateCutoutPayload(profile, ""));
      setProfile(updated);
    } catch (e) {
      setCutoutError(toErrorMessage(e, "Could not remove cut-out."));
    } finally {
      setUploadingCutout(false);
    }
  };

  return (
    <BrandCard
      title={title}
      line={line}
      action={
        <button type="button" onClick={onEdit} className={brandText.link}>
          Custom colours
        </button>
      }
    >
      <div className="space-y-5">
        {/* Top: Cover preview and theme radio swatches */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-[200px] max-w-full shrink-0">
            <BrandLookPreview
              bare
              colors={profile}
              brandName={profile.brand_name}
              byline={profile.cover_byline}
              logoUrl={profile.primary_logo_url}
              art={profile.cover_art}
              font={font}
            />
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
                        {saving === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" />
                        ) : (
                          on && <Check className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {fonts.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className={brandText.label}>Font</p>
                <ul role="radiogroup" aria-label="Cover font" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fonts.map((f) => {
                    const on = f.id === font;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => void pickFont(f.id)}
                          className={`w-full cursor-pointer rounded-2xl p-1.5 text-left focus-visible:outline-2 focus-visible:outline-brand ${on ? "ring-2 ring-ink" : "ring-1 ring-line hover:ring-subtle"}`}
                        >
                          <span className="flex aspect-[3/1] items-center justify-center overflow-hidden rounded-xl bg-white">
                            {/* The sample is server-drawn SVG: its letters are shapes, so no font loads here. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(f.svg)}`} alt="" className="h-full w-full object-contain" />
                          </span>
                          <span className="flex items-center justify-between gap-1 px-1.5 pb-0.5 pt-2 text-[15px] text-ink">
                            <span className="min-w-0">
                              <span className="block truncate">{f.label}</span>
                              <span className="block truncate text-[13px] text-subtle">{f.about}</span>
                            </span>
                            {fontSaving === f.id ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden="true" />
                            ) : (
                              on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className={brandText.note}>New covers and carousels use it. Covers already made keep theirs.</p>
              </div>
            )}
            {!current && (
              <p className={brandText.note}>
                You use custom colours. Change them under Custom colours.
              </p>
            )}
            {error && <ErrorLine text={error} />}
          </div>
        </div>

        {/* Dual photo uploads parallel on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-line/60">
          {/* 1. Headshot Photo */}
          <div className="rounded-2xl border border-line bg-surface/50 p-3 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-ink">Headshot</span>
                {profile.primary_logo_url && !uploadingPhoto && (
                  <button
                    type="button"
                    onClick={() => void removePhoto()}
                    className="text-[12px] text-subtle hover:text-danger hover:underline cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[12px] leading-snug text-muted">
                Square photo or logo. Shown on your avatar and standard covers.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              {profile.primary_logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.primary_logo_url}
                  alt="Headshot"
                  className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
                />
              )}
              <label
                className={`${buttonStyles({ variant: "secondary", size: "sm", block: true })} flex-1 cursor-pointer ${uploadingPhoto ? "pointer-events-none opacity-60" : ""}`}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-hidden="true" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    <span>{profile.primary_logo_url ? "Change" : "Upload photo"}</span>
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
            </div>
            {photoError && <ErrorLine text={photoError} />}
          </div>

          {/* 2. Cut-out Photo */}
          <div className="rounded-2xl border border-line bg-surface/50 p-3 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-ink">Cut-out photo</span>
                {profile.cover_cutout_url && !uploadingCutout && (
                  <button
                    type="button"
                    onClick={() => void removeCutout()}
                    className="text-[12px] text-subtle hover:text-danger hover:underline cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[12px] leading-snug text-muted">
                Transparent PNG (no background). Powers modern face poster designs.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              {profile.cover_cutout_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.cover_cutout_url}
                  alt="Cut-out"
                  className="h-9 w-9 shrink-0 rounded-lg bg-[repeating-conic-gradient(#8883_0_25%,transparent_0_50%)] bg-[length:6px_6px] border border-line object-contain"
                />
              )}
              <label
                className={`${buttonStyles({ variant: "secondary", size: "sm", block: true })} flex-1 cursor-pointer ${uploadingCutout ? "pointer-events-none opacity-60" : ""}`}
              >
                {uploadingCutout ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-hidden="true" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                    <span>{profile.cover_cutout_url ? "Change" : "Upload cut-out"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png"
                  className="hidden"
                  disabled={uploadingCutout}
                  onChange={(e) => {
                    void uploadCutout(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {cutoutError && <ErrorLine text={cutoutError} />}
          </div>
        </div>
      </div>
    </BrandCard>
  );
}

/** A tiny cover in the theme's colours: paper, two lines of headline with one accent word, the initials dot. */
function ThemeSwatch({ theme }: { theme: CoverTheme }) {
  return (
    <span
      aria-hidden="true"
      className="flex aspect-[4/3] flex-col justify-between rounded-xl p-2.5"
      style={{ backgroundColor: theme.brand_cream }}
    >
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
