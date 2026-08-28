import type { AudienceLane } from "@/types";

/**
 * Audience and source badge styling for the Idea Stream.
 * Extracted from the page so the card component and the modals share one map.
 */
export function getAudienceBadgeClass(aud: AudienceLane): string {
  switch (aud) {
    case "ICP":
      return "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
    case "PEER":
      return "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30";
    case "BRIDGE":
      return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
    default:
      return "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D]";
  }
}


/** Source badge label and colour. */
export function getSourceTag(source: string): { label: string; className: string } {
  const s = (source || "").toUpperCase();
  if (s.includes("TECHCRUNCH")) {
    return {
      label: "TechCrunch AI",
      className: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
    };
  }
  if (s.includes("HACKER") || s.includes("HN")) {
    return {
      label: "Hacker News",
      className: "bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30"
    };
  }
  if (s.includes("N8N")) {
    return {
      label: "n8n Blog",
      className: "bg-[#EA580C]/15 text-[#EA580C] border-[#EA580C]/30"
    };
  }
  if (s.includes("HOME") || s.includes("SERVICE") || s.includes("GOOGLE") || s.includes("TRENDS")) {
    return {
      label: "Industry Signals",
      className: "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/30"
    };
  }
  if (s.includes("REDDIT")) {
    return {
      label: "Reddit",
      className: "bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30"
    };
  }
  if (s.includes("HARVESTER")) {
    return {
      label: "Signal Harvester",
      className: "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/30"
    };
  }
  if (s.includes("BRAND") || s.includes("PHILOSOPHY") || s.includes("CORE")) {
    return {
      label: "Brand Core",
      className: "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30"
    };
  }
  return {
    label: source || "Manual",
    className: "bg-[#1E2733] text-[#94A3B8] border-[#2A3D52]"
  };
}
