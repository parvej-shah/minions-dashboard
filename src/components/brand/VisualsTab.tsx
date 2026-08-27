"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Check, Copy, ExternalLink, ImageIcon, Upload, Loader2 } from "lucide-react";
import type { BrandTab, BrandSettings } from "@/types";
import { apiClient } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";

export interface VisualsTabProps {
  logoBgMode: "dark" | "white" | "teal" | "checker";
  setLogoBgMode: (m: "dark" | "white" | "teal" | "checker") => void;
  activeLogoVariant: "inverted" | "primary" | "teal";
  setActiveLogoVariant: (v: "inverted" | "primary" | "teal") => void;
  currentLogoSrc: string; // Deprecated but kept for signature
  setActiveTab: (t: BrandTab) => void;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

export default function VisualsTab({
  logoBgMode,
  setLogoBgMode,
  setActiveTab,
  copiedKey,
  copyToClipboard,
}: VisualsTabProps) {
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

      // Update brand profile with new logo
      const updatedProfile = await apiClient.post<BrandSettings>("/api/brand", {
        ...profile,
        primary_logo_url: url
      });
      setProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading visual assets..." />;
  const activeUrl = profile?.primary_logo_url || "https://placehold.co/400x100?text=Upload+Logo";

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
            <h2 className="text-sm font-bold text-[#F1F5F9]">Brand Primary Logo</h2>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload New Logo
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
        </div>
        
        <p className="text-xs text-[#94A3B8]">
          Your primary transparent logo used across your public presence.
        </p>

        <div className={`p-10 rounded-2xl border border-[#1F2D3D] flex items-center justify-center min-h-[180px] shadow-inner relative transition-all group ${
            logoBgMode === "dark" ? "bg-[#070B0F]" : logoBgMode === "white" ? "bg-white" : logoBgMode === "teal" ? "bg-[#0E5C63]" : "bg-[#121820] bg-[radial-gradient(#263445_1px,transparent_1px)] [background-size:12px_12px]"
        }`}>
          <img
            src={activeUrl}
            alt="Brand Logo"
            className="max-h-24 max-w-[400px] object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => copyToClipboard(activeUrl, "logo-path")} className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-[#00C9A7] border border-[#1F2D3D] transition-all">
              {copiedKey === "logo-path" ? <Check className="w-3.5 h-3.5 text-[#00C9A7]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#0F1419]/90 backdrop-blur-md text-[#94A3B8] hover:text-white border border-[#1F2D3D] transition-all">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-[11px] font-mono text-[#64748B]">Preview Background:</span>
          <button onClick={() => setLogoBgMode("dark")} className={`w-6 h-6 rounded-lg bg-[#070B0F] border ${logoBgMode === "dark" ? "border-[#00C9A7]" : "border-[#1F2D3D]"}`} />
          <button onClick={() => setLogoBgMode("white")} className={`w-6 h-6 rounded-lg bg-white border ${logoBgMode === "white" ? "border-[#00C9A7]" : "border-[#1F2D3D]"}`} />
          <button onClick={() => setLogoBgMode("teal")} className={`w-6 h-6 rounded-lg bg-[#0E5C63] border ${logoBgMode === "teal" ? "border-[#00C9A7]" : "border-[#1F2D3D]"}`} />
          <button onClick={() => setLogoBgMode("checker")} className={`w-6 h-6 rounded-lg bg-[#121820] border ${logoBgMode === "checker" ? "border-[#00C9A7]" : "border-[#1F2D3D]"}`} />
        </div>
      </div>
    </div>
  );
}
