"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Mic2, Sparkles, Rss, BookOpen } from "lucide-react";
import { BrandDirectiveItem, BrandTab } from "@/types";
import LexiconTab from "@/components/brand/LexiconTab";
import { isBannedPhrase } from "@/lib/drafts/banned";
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
      <div className="space-y-5 border-b border-line pb-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-mono tracking-[0.16em] text-brand uppercase">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
            Brand profile
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Brand</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Tell the AI who you are, what you post about, and how you sound.
          </p>
        </div>

        <div
          role="group"
          aria-label="Brand sections"
          className="flex w-full max-w-full flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-surface p-1"
        >
          <button
            type="button"
            aria-pressed={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            className={"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "overview" ? "bg-brand text-canvas" : "text-muted hover:text-ink")}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Overview
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "voice-proof"}
            onClick={() => setActiveTab("voice-proof")}
            className={"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "voice-proof" ? "bg-brand text-canvas" : "text-muted hover:text-ink")}
          >
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            Voice &amp; Proof
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "experience"}
            onClick={() => setActiveTab("experience")}
            className={"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "experience" ? "bg-brand text-canvas" : "text-muted hover:text-ink")}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Audience &amp; Experience
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "sources"}
            onClick={() => setActiveTab("sources")}
            className={"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "sources" ? "bg-brand text-canvas" : "text-muted hover:text-ink")}
          >
            <Rss className="h-4 w-4" aria-hidden="true" />
            Idea Sources
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "lexicon"}
            onClick={() => setActiveTab("lexicon")}
            className={"inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "lexicon" ? "bg-brand text-canvas" : "text-muted hover:text-ink")}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Banned Words ({forbiddenDirectives.filter((d) => isBannedPhrase(d.content)).length})
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
