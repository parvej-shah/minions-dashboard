"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Mic2, Sparkles, Rss, BookOpen } from "lucide-react";
import { BrandDirectiveItem, BrandTab } from "@/types";
import LexiconTab from "@/components/brand/LexiconTab";
import OverviewTab from "@/components/brand/OverviewTab";
import VoiceProofTab from "@/components/brand/VoiceProofTab";
import SourcesTab from "@/components/brand/SourcesTab";
import ExperienceTab from "@/components/brand/ExperienceTab";
import CompletenessCard from "@/components/brand/CompletenessCard";
import { useApiResource } from "@/hooks/useApiResource";

const BRAND_TABS: BrandTab[] = ["overview", "voice-proof", "experience", "sources", "lexicon"];

// useSearchParams needs a Suspense boundary on a prerendered route.
export default function BrandStudioPage() {
  return (
    <Suspense>
      <BrandStudio />
    </Suspense>
  );
}

function BrandStudio() {
  // ?tab=experience opens a tab directly (the home page's weekly question links here).
  const requested = useSearchParams().get("tab");
  const [activeTab, setActiveTab] = useState<BrandTab>(
    BRAND_TABS.includes(requested as BrandTab) ? (requested as BrandTab) : "overview"
  );
  // Bumped after any profile edit so the completeness card re-reads.
  const [profileVersion, setProfileVersion] = useState(0);
  const bumpProfile = () => setProfileVersion((v) => v + 1);
  const {
    data: directives,
    isLoading: directivesLoading,
    setData: setDirectives,
  } = useApiResource<BrandDirectiveItem[]>("/api/brand/directives", [], {
    errorMessage: "Could not load brand directives",
  });

  // Banned lexicon: derived from the same FORBIDDEN-category BrandDirective rows
  // the drafting pipeline reads -- not a separate, disconnected list. Banned
  // words/phrases are intentionally uncapped -- a brand's blocklist can
  // legitimately grow large.
  const forbiddenDirectives = directives.filter((d) => d.category === "FORBIDDEN");

  const [newBannedWord, setNewBannedWord] = useState("");
  const [isAddingBannedWord, setIsAddingBannedWord] = useState(false);

  const deleteDirective = async (id: string) => {
    const previous = directives;
    setDirectives(directives.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/brand/directives/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setDirectives(previous);
    }
  };

  const handleAddBannedWord = async () => {
    const word = newBannedWord.trim();
    if (!word) return;
    setIsAddingBannedWord(true);
    try {
      const res = await fetch("/api/brand/directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "FORBIDDEN",
          key: word,
          content: word,
          priority: 1,
          audience_scope: "ALL",
        }),
      });
      if (res.ok) {
        const created: BrandDirectiveItem = await res.json();
        setDirectives((prev) => [created, ...prev]);
      }
    } catch {
      // No local fallback: a banned word that only exists client-side would silently
      // never reach the pipeline's actual brand context query.
    } finally {
      setNewBannedWord("");
      setIsAddingBannedWord(false);
    }
  };

  const removeBannedWord = (id: string) => deleteDirective(id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Brand Governance & Visual Asset Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">Brand</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Tell the AI who you are, what you post about, and how you sound.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] self-start md:self-auto gap-1 max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("voice-proof")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "voice-proof"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            Voice & Proof
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("experience")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "experience"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Audience &amp; Experience
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "sources"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            Idea Sources
          </button>
          <button
            onClick={() => setActiveTab("lexicon")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "lexicon"
                ? "bg-[#00C9A7] text-[#070B0F] shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Banned Words ({forbiddenDirectives.length})
          </button>
        </div>
      </div>

      <CompletenessCard version={profileVersion} onGo={setActiveTab} />

      {/* ======================================================== */}
      {/* OVERVIEW: plain-language summary, the default landing view */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <OverviewTab directives={directives} setDirectives={setDirectives} onEditAudience={() => setActiveTab("experience")} />
      )}

      {activeTab === "experience" && <ExperienceTab onChange={bumpProfile} />}

      {activeTab === "voice-proof" && <VoiceProofTab />}

      {/* ======================================================== */}
      {/* IDEA SOURCES: the feeds the harvester reads, per tenant   */}
      {/* ======================================================== */}
      {activeTab === "sources" && <SourcesTab />}

      {/* ======================================================== */}
      {/* BANNED LEXICON & COMPLIANCE */}
      {/* ======================================================== */}
      {activeTab === "lexicon" && (
        <LexiconTab
          bannedWords={forbiddenDirectives}
          isLoading={directivesLoading}
          isSubmitting={isAddingBannedWord}
          newBannedWord={newBannedWord}
          setNewBannedWord={setNewBannedWord}
          onAddBannedWord={handleAddBannedWord}
          onRemoveBannedWord={removeBannedWord}
        />
      )}
    </div>
  );
}
