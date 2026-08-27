"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Download, ExternalLink, Sparkles, Upload, Loader2, Trash2 } from "lucide-react";
import type { MascotItem, BrandSettings } from "@/types";
import { apiClient } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";

export default function MascotsTab() {
  const [profile, setProfile] = useState<BrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    apiClient.get<BrandSettings>("/api/brand").then(data => {
      if (mounted) { setProfile(data); setIsLoading(false); }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const mascots = profile?.visual_assets?.mascots || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const newMascot: MascotItem = {
        id: `MASC-${Date.now()}`,
        name: file.name,
        codename: "CUSTOM",
        role: "Brand Character",
        trade: "Mascot",
        model: "Uploaded",
        description: "Custom uploaded mascot.",
        avatar_path: url,
        full_asset_path: url,
        status: "ACTIVE",
        skills: ["Brand Representation"]
      };

      const updatedProfile = await apiClient.post<BrandSettings>("/api/brand", {
        ...profile,
        visual_assets: {
          ...profile.visual_assets,
          mascots: [newMascot, ...mascots]
        }
      });
      setProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMascot = async (id: string) => {
    if (!profile) return;
    const updatedProfile = await apiClient.post<BrandSettings>("/api/brand", {
      ...profile,
      visual_assets: {
        ...profile.visual_assets,
        mascots: mascots.filter(m => m.id !== id)
      }
    });
    setProfile(updatedProfile);
  };

  if (isLoading) return <LoadingState label="Loading mascots..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-[#94A3B8]">
          Manage your custom brand characters and mascots for visual asset generation.
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl transition-all"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload New Mascot
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mascots.length === 0 && (
          <div className="col-span-full p-8 text-center text-[#94A3B8] bg-[#0F1419] rounded-2xl border border-[#1F2D3D]">
            No mascots uploaded yet.
          </div>
        )}
        {mascots.map((mascot) => (
          <div key={mascot.id} className="group flex flex-col rounded-2xl bg-[#0F1419] border border-[#1F2D3D] overflow-hidden hover:border-[#00C9A7]/40 transition-all shadow-sm">
            <div className="relative w-full aspect-square bg-[#070B0F] flex items-center justify-center p-4 border-b border-[#1F2D3D]">
              <img src={mascot.full_asset_path} alt={mascot.name} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-[#070B0F]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a href={mascot.full_asset_path} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg" title="Open Image">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => deleteMascot(mascot.id)} className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all shadow-lg" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1">
              <h4 className="text-sm font-bold text-[#F1F5F9] truncate" title={mascot.name}>{mascot.name}</h4>
              <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">{mascot.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
