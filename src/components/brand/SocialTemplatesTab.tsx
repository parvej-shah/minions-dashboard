"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Download, ExternalLink, Filter, Plus, Upload, Loader2, Trash2 } from "lucide-react";
import type { SocialTemplateItem, BrandSettings } from "@/types";
import { apiClient } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";

export default function SocialTemplatesTab() {
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

  const covers = profile?.visual_assets?.socialCovers || [];

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

      const newCover: SocialTemplateItem = {
        id: `COV-${Date.now()}`,
        platform: "CUSTOM",
        type: "COVER",
        name: file.name,
        dimensions: "Auto",
        theme: "CUSTOM",
        path: url,
        description: "Custom uploaded social cover."
      };

      const updatedProfile = await apiClient.post<BrandSettings>("/api/brand", {
        ...profile,
        visual_assets: {
          ...profile.visual_assets,
          socialCovers: [newCover, ...covers]
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

  const deleteCover = async (id: string) => {
    if (!profile) return;
    const updatedProfile = await apiClient.post<BrandSettings>("/api/brand", {
      ...profile,
      visual_assets: {
        ...profile.visual_assets,
        socialCovers: covers.filter(c => c.id !== id)
      }
    });
    setProfile(updatedProfile);
  };

  if (isLoading) return <LoadingState label="Loading social covers..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-[#94A3B8]">
          Manage your custom social covers and avatars for cross-platform publishing.
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl transition-all"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload New Cover
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {covers.length === 0 && (
          <div className="col-span-full p-8 text-center text-[#94A3B8] bg-[#0F1419] rounded-2xl border border-[#1F2D3D]">
            No social covers uploaded yet.
          </div>
        )}
        {covers.map((tmpl) => (
          <div key={tmpl.id} className="group flex flex-col rounded-2xl bg-[#0F1419] border border-[#1F2D3D] overflow-hidden hover:border-[#00C9A7]/40 transition-all shadow-sm">
            <div className="relative w-full aspect-video bg-[#070B0F] flex items-center justify-center p-4 border-b border-[#1F2D3D]">
              <img src={tmpl.path} alt={tmpl.name} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-[#070B0F]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a href={tmpl.path} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg" title="Open Image">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a href={tmpl.path} download className="p-2.5 rounded-xl bg-[#00C9A7]/90 hover:bg-[#00C9A7] text-[#070B0F] transition-all shadow-lg" title="Download">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => deleteCover(tmpl.id)} className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all shadow-lg" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[#F1F5F9] truncate" title={tmpl.name}>{tmpl.name}</h4>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                  {tmpl.dimensions}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">{tmpl.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
