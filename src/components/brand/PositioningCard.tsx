"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, User } from "lucide-react";
import type { BrandCategory, BrandDirectiveItem, BrandSettings } from "@/types";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { toProfileInput } from "@/lib/brandProfileInput";
import { buttonStyles } from "@/components/ui/Button";
import { sectionCardClass } from "@/components/ui/fieldStyles";
import TagList from "@/components/brand/TagList";

interface Props {
  profile: BrandSettings | null;
  setProfile: (profile: BrandSettings) => void;
  items: BrandDirectiveItem[];
  onAdd: (category: BrandCategory, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  /** The ideal customer's description, to tell a positioning that only repeats it. */
  audience?: string;
}

const sameText = (a: string, b: string) => a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The brand name and what the writer does, editable in place, with the identity
 * notes under them. Setup used to save the audience here, so a positioning that
 * only repeats the audience is treated as not written yet.
 */
export default function PositioningCard({ profile, setProfile, items, onAdd, onRemove, audience = "" }: Props) {
  const positioning = profile?.positioning ?? "";
  const repeatsAudience = Boolean(positioning && audience && sameText(positioning, audience));
  const shown = repeatsAudience ? "" : positioning;
  const [isEditing, setIsEditing] = useState(false);
  const [positioningDraft, setPositioningDraft] = useState("");
  // brand_name is what every generated cover prints, so it is edited with the positioning.
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
    } catch (err) {
      setError(toErrorMessage(err, "Could not save your brand basics."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className={sectionCardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold text-ink">What you do</h3>
          </div>
          {!isEditing && (
            <button type="button" onClick={openEdit} className="min-h-10 min-w-10 cursor-pointer rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-brand" aria-label="Edit your name and what you do">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label htmlFor="brand-name" className="mb-1 block text-xs font-semibold text-muted">
                Name on your covers
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
            <label htmlFor="brand-positioning" className="block text-xs font-semibold text-muted">What you do, in a line or two</label>
            <textarea
              id="brand-positioning"
              rows={3}
              value={positioningDraft}
              onChange={(e) => setPositioningDraft(e.target.value)}
              placeholder="e.g. I build AI voice agents that answer every call for real-estate teams."
              className="w-full bg-surface-2 border border-line rounded-xl p-3 text-xs text-ink resize-none focus:outline-none focus:border-brand"
            />
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
        <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              {profile?.brand_name || "Unnamed brand"}
            </p>
            {shown ? (
              <p className="text-sm text-ink leading-relaxed">{shown}</p>
            ) : (
              <button type="button" onClick={openEdit} className="text-left text-sm text-muted hover:text-ink cursor-pointer">
                {repeatsAudience ? "This only repeated your audience. " : ""}
                <span className="font-semibold text-brand">Say what you do in a line</span>, so posts introduce you right.
              </button>
            )}
          </div>
        )}

        <TagList
          category="POSITIONING"
          items={items}
          onAdd={onAdd}
          onRemove={onRemove}
          placeholder="What sets you apart…"
        />
      </div>
  );
}
