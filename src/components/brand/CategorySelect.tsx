"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Info, Sparkles } from "lucide-react";
import { BrandCategory } from "@/types";
import { CATEGORIES, CategoryMeta } from "@/constants/brandAssets";

interface CategorySelectProps {
  value: BrandCategory;
  onChange: (val: BrandCategory) => void;
  label?: string;
  className?: string;
}

export default function CategorySelect({
  value,
  onChange,
  label = "Category",
  className = "",
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryMeta | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCategory = CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
  const previewCategory = hoveredCategory || activeCategory;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-[#94A3B8]">{label}</label>
          <span className="text-[10px] font-mono text-[#00C9A7]/80 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Hover to learn
          </span>
        </div>
      )}

      {/* Custom Select Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-[#161D26] border border-[#1F2D3D] hover:border-[#00C9A7]/50 rounded-xl px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7]" />
            <span className="font-semibold">{activeCategory.label}</span>
            <span className="text-[10px] font-mono text-[#94A3B8] bg-[#0F1419] px-1.5 py-0.5 rounded border border-[#1F2D3D]">
              {activeCategory.stage}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu with Hover Preview */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-full md:w-[480px] z-50 bg-[#0F1419] border border-[#00C9A7]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[380px] animate-in fade-in zoom-in-95 duration-150">
            {/* Options List */}
            <div className="w-full md:w-1/2 overflow-y-auto max-h-[220px] md:max-h-[380px] p-1.5 space-y-0.5 border-b md:border-b-0 md:border-r border-[#1F2D3D]">
              {CATEGORIES.map((c) => {
                const isSelected = c.value === value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      onChange(c.value);
                      setIsOpen(false);
                      setHoveredCategory(null);
                    }}
                    onMouseEnter={() => setHoveredCategory(c)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex flex-col transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#00C9A7]/15 text-[#00C9A7] font-bold border border-[#00C9A7]/30"
                        : "text-[#F1F5F9] hover:bg-[#161D26] hover:text-[#00C9A7]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{c.label}</span>
                      <span className="text-[9px] font-mono text-[#64748B]">{c.value}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hover Explainer Panel */}
            <div className="w-full md:w-1/2 p-3 bg-[#070B0F]/90 flex flex-col justify-between text-xs space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-1.5">
                  <span className="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00C9A7]" />
                    {previewCategory.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30">
                    {previewCategory.stage}
                  </span>
                </div>

                <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                  {previewCategory.desc}
                </p>

                <div className="p-2 rounded-lg bg-[#161D26] border border-[#1F2D3D] space-y-1">
                  <span className="text-[9px] font-mono uppercase text-[#64748B] block">
                    Example Rule:
                  </span>
                  <p className="text-[10px] text-[#94A3B8] italic">
                    &ldquo;{previewCategory.example}&rdquo;
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-[#64748B] font-mono border-t border-[#1F2D3D]/50 pt-1.5">
                Targeted by: {previewCategory.stage}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Category Helper Callout Below Dropdown */}
      <div className="p-2 rounded-xl bg-[#161D26]/70 border border-[#1F2D3D] text-[11px] text-[#94A3B8] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#00C9A7] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-[#F1F5F9]">{activeCategory.label}: </span>
          <span>{activeCategory.desc} </span>
          <span className="text-[#00C9A7] font-mono text-[10px]">({activeCategory.stage})</span>
        </div>
      </div>
    </div>
  );
}
