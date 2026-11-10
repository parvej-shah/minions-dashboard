"use client";

import { useState } from "react";
import type { BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/fieldStyles";
import { LoadingState } from "@/components/ui/EmptyState";
import { BrandCard, brandText } from "@/components/brand/parts";

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
  /** The reader's description, to tell a positioning that only repeats it. */
  audience?: string;
  onSaved?: () => void;
}

const sameText = (a: string, b: string) => a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The name and what the writer does, edited in place. Setup used to save the
 * audience here, so a positioning that only repeats the audience is treated
 * as not written yet.
 */
export default function PositioningCard({ profile, setProfile, audience = "", onSaved }: Props) {
  const positioning = profile?.positioning ?? "";
  const repeatsAudience = Boolean(positioning && audience && sameText(positioning, audience));
  const shown = repeatsAudience ? "" : positioning;
  const [isEditing, setIsEditing] = useState(false);
  const [positioningDraft, setPositioningDraft] = useState("");
  // brand_name is what every cover prints, so it is edited with the positioning.
  const [brandNameDraft, setBrandNameDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    if (!profile) return;
    setError(null);
    setPositioningDraft(repeatsAudience ? profile.cover_byline || "" : profile.positioning);
    setBrandNameDraft(profile.brand_name);
    setIsEditing(true);
  };

  const save = async () => {
    if (!profile) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", {
        ...toProfileInput(profile),
        brand_name: brandNameDraft.trim() || profile.brand_name,
        positioning: positioningDraft,
      });
      setProfile(updated);
      setIsEditing(false);
      onSaved?.();
    } catch (err) {
      setError(toErrorMessage(err, "Could not save that."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BrandCard
      title="What you do"
      line="How posts introduce you."
      action={!isEditing && profile && <button type="button" onClick={openEdit} className={brandText.link}>Edit</button>}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="brand-name" className={brandText.label}>Your name or company</label>
            <input id="brand-name" type="text" value={brandNameDraft} onChange={(e) => setBrandNameDraft(e.target.value)} placeholder="e.g. Acme HVAC" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="brand-positioning" className={brandText.label}>What you do, in a line or two</label>
            <textarea
              id="brand-positioning"
              rows={3}
              value={positioningDraft}
              onChange={(e) => setPositioningDraft(e.target.value)}
              placeholder="e.g. I build AI voice agents that answer every call for real-estate teams."
              className={`${inputClass} resize-none`}
            />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={save} loading={isSaving}>Save</Button>
          </div>
        </div>
      ) : !profile ? (
        <LoadingState rows={1} />
      ) : (
        <div className="space-y-1">
          <p className="text-[17px] font-semibold text-ink">{profile.brand_name || "No name yet"}</p>
          {shown ? (
            <p className={brandText.value}>{shown}</p>
          ) : (
            <button type="button" onClick={openEdit} className={`${brandText.link} text-left text-[17px]`}>
              Say what you do in a line
            </button>
          )}
        </div>
      )}
    </BrandCard>
  );
}
