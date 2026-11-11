"use client";

import { useState } from "react";
import type { BrandProfileInput, BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { Button } from "@/components/ui/Button";
import { BrandCard } from "@/components/brand/parts";
import BrandLookPreview from "@/components/brand/BrandLookPreview";

// Ordered and labeled by each colour's role on a cover (src/lib/covers):
// the paper, the text, the accent word and quote mark, the big number and the initials badge.
const LOOK_COLOR_FIELDS: { key: "brand_cream" | "primary_ink" | "brand_coral" | "brand_teal"; label: string; role: string }[] = [
  { key: "brand_cream", label: "Paper", role: "Card background" },
  { key: "primary_ink", label: "Text", role: "Headline & body" },
  { key: "brand_coral", label: "Accent word", role: "Highlighted claim" },
  { key: "brand_teal", label: "Number & initials", role: "Badges & accents" },
];

type ColorDraft = Pick<
  BrandProfileInput,
  "primary_ink" | "brand_teal" | "brand_coral" | "brand_cream" | "accent_blue"
>;

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
}

/** Custom colours for post covers. Pure color customization with live preview. */
export default function CoverAppearanceCard({ profile, setProfile }: Props) {
  const [changes, setChanges] = useState<ColorDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorDraft = changes ?? (profile ? fromProfile(profile) : null);
  const setColorDraft = (d: ColorDraft) => setChanges(d);
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
      setError(toErrorMessage(err, "Could not save your custom colours."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BrandCard
      title="Custom colours"
      line="Choose your own brand palette for post covers, or select a ready-made theme on Your brand."
    >
      {colorDraft && profile ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LOOK_COLOR_FIELDS.map(({ key, label, role }) => (
              <label key={key} className="block cursor-pointer space-y-1.5 group">
                <span
                  className="relative block h-14 overflow-hidden rounded-2xl ring-1 ring-line transition-transform group-hover:scale-[1.02]"
                  style={{ backgroundColor: colorDraft[key] }}
                >
                  <input
                    type="color"
                    value={colorDraft[key]}
                    onChange={(e) => setColorDraft({ ...colorDraft, [key]: e.target.value.toUpperCase() })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>
                <div className="text-center">
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block text-xs font-mono text-muted">{colorDraft[key]}</span>
                  <span className="block text-[11px] text-subtle">{role}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <p className="mb-2 text-xs font-medium text-muted">Live cover sample with your colours:</p>
            <BrandLookPreview
              bare
              colors={colorDraft}
              brandName={profile.brand_name}
              byline={profile.cover_byline}
              logoUrl={profile.primary_logo_url}
              art={profile.cover_art}
            />
          </div>

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          {dirty && (
            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="ghost"
                onClick={() => {
                  setChanges(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={save} loading={isSaving}>
                Save colours
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </BrandCard>
  );
}

function fromProfile(p: BrandSettings): ColorDraft {
  return {
    primary_ink: p.primary_ink,
    brand_teal: p.brand_teal,
    brand_coral: p.brand_coral,
    brand_cream: p.brand_cream,
    accent_blue: p.accent_blue,
  };
}
