"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Loader2, Palette, Plus, Save, Trash2, Mic } from "lucide-react";
import type { BrandProfileInput, BrandSettings } from "@/types";
import { LoadingState } from "@/components/ui/EmptyState";
import { apiClient, toErrorMessage } from "@/lib/api-client";

const TONE_OPTIONS: { value: BrandProfileInput["tone_formality"]; label: string }[] = [
  { value: "technical_direct", label: "Technical & Direct" },
  { value: "tactile_operator", label: "Tactile Operator" },
  { value: "conversational_peer", label: "Conversational Peer" },
];

const COLOR_FIELDS: { key: keyof BrandProfileInput; label: string; hint: string }[] = [
  { key: "primary_ink", label: "Primary Dark", hint: "Dark Backgrounds / Text" },
  { key: "brand_teal", label: "Primary Accent", hint: "Main Brand Color" },
  { key: "brand_coral", label: "Secondary Accent", hint: "CTAs & Highlights" },
  { key: "brand_cream", label: "Light Canvas", hint: "Light Backgrounds" },
  { key: "accent_blue", label: "Tertiary Accent", hint: "Data & Charts" },
];

function toInput(settings: BrandSettings): BrandProfileInput {
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

/** Company info, voice guidelines, and color tokens — editable and Supabase-synced. */
export default function ProfileTab() {
  const [form, setForm] = useState<BrandProfileInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newClaim, setNewClaim] = useState("");

  useEffect(() => {
    let mounted = true;
    apiClient
      .get<BrandSettings>("/api/brand")
      .then((data) => {
        // Functional check so a second Strict-Mode-invoked fetch resolving
        // after the first can't clobber a load (or an edit made since).
        if (mounted) setForm((prev) => prev ?? toInput(data));
      })
      .catch((err) => {
        if (mounted) setError(toErrorMessage(err, "Could not load brand settings"));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const set = <K extends keyof BrandProfileInput>(key: K, value: BrandProfileInput[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const addProofClaim = () => {
    if (!form || !newClaim.trim()) return;
    set("allowed_proof_claims", [...form.allowed_proof_claims, newClaim.trim()]);
    setNewClaim("");
  };

  const removeProofClaim = (claim: string) => {
    if (!form) return;
    set(
      "allowed_proof_claims",
      form.allowed_proof_claims.filter((c) => c !== claim)
    );
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiClient.post<BrandSettings>("/api/brand", form);
      setForm(toInput(updated));
      setSaved(true);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to save brand settings"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading brand profile…" />;
  if (!form) {
    return (
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-400">
        {error ?? "Could not load brand settings"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Company Info */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00C9A7]" />
          <h3 className="text-sm font-bold text-[#F1F5F9]">Company Info</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Brand Name</label>
            <input
              type="text"
              value={form.brand_name}
              onChange={(e) => set("brand_name", e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Company Domain</label>
            <input
              type="text"
              value={form.company_domain}
              onChange={(e) => set("company_domain", e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Primary Logo URL</label>
            <input
              type="text"
              value={form.primary_logo_url}
              onChange={(e) => set("primary_logo_url", e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] font-mono focus:outline-none focus:border-[#00C9A7]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Positioning</label>
            <textarea
              rows={2}
              value={form.positioning}
              onChange={(e) => set("positioning", e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl p-3 text-xs text-[#F1F5F9] resize-none focus:outline-none focus:border-[#00C9A7]"
            />
          </div>
        </div>
      </div>

      {/* Voice Guidelines */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#00C9A7]" />
          <h3 className="text-sm font-bold text-[#F1F5F9]">Voice Guidelines</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Formality</label>
            <select
              value={form.tone_formality}
              onChange={(e) => set("tone_formality", e.target.value as BrandProfileInput["tone_formality"])}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#94A3B8] block mb-1">Cadence</label>
            <input
              type="text"
              value={form.tone_cadence}
              onChange={(e) => set("tone_cadence", e.target.value)}
              className="w-full bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-[#94A3B8] block mb-2">
            Allowed Proof Claims ({form.allowed_proof_claims.length})
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.allowed_proof_claims.map((claim) => (
              <span
                key={claim}
                className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] px-2.5 py-1 rounded-lg"
              >
                {claim}
                <button onClick={() => removeProofClaim(claim)} className="hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a verifiable proof claim…"
              value={newClaim}
              onChange={(e) => setNewClaim(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProofClaim())}
              className="flex-1 bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            />
            <button
              onClick={addProofClaim}
              className="flex items-center gap-1 bg-[#161D26] hover:bg-[#1F2D3D] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>

            {/* Colors */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#00C9A7]" />
          <h3 className="text-sm font-bold text-[#F1F5F9]">Color Palette Tokens</h3>
        </div>
        
        <div className="bg-[#161D26] p-4 rounded-xl border border-[#1F2D3D] mb-4">
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            <strong className="text-[#F1F5F9]">How Colors Work:</strong> Our AI asset generators and n8n workflows rely on a specific semantic token system (e.g. "Primary Ink" for backgrounds, "Brand Teal" for primary accents) to ensure contrast and visual harmony across social covers, PDFs, and graphics.
            While the semantic names below (like "Deep Slate Ink" or "Vibrant Coral") reflect our default palette structure, you can change the underlying HEX codes to match your brand's exact equivalents for each role.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
              <label
                className="h-12 rounded-lg border border-[#1F2D3D] shadow-inner block cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: form[key] as string }}
              >
                <input
                  type="color"
                  value={form[key] as string}
                  onChange={(e) => set(key, e.target.value.toUpperCase() as BrandProfileInput[typeof key])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              <div className="text-xs font-bold text-[#F1F5F9]">{label}</div>
              <input
                type="text"
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value.toUpperCase() as BrandProfileInput[typeof key])}
                className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-lg px-2 py-1 text-[11px] font-mono text-[#00C9A7] focus:outline-none focus:border-[#00C9A7]"
              />
              <div className="text-[10px] text-[#64748B]">{hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-[11px] text-[#00C9A7] font-semibold">
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Brand Profile
        </button>
      </div>
    </div>
  );
}
