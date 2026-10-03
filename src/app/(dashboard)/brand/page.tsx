"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Mic2, Sparkles, Rss, BookOpen, ChevronDown } from "lucide-react";
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
  const [showMoreSettings, setShowMoreSettings] = useState(requested === "sources" || requested === "lexicon");
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
    <div className="mx-auto max-w-7xl space-y-7 pb-16">
      <div className="space-y-5 border-b border-line pb-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-brand/30 bg-brand/10 text-brand">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-mono tracking-[0.14em] text-brand uppercase">Your voice, your point of view</div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Make every post sound like you</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Shape what Minions knows about your work, your readers, and the way you write.</p>
          </div>
        </div>

        <div className="space-y-2">
          <div role="group" aria-label="Brand foundations" className="flex w-full max-w-full flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain rounded-2xl border-2 border-line bg-surface p-1">
            <button type="button" aria-pressed={activeTab === "overview"} onClick={() => setActiveTab("overview")} className={"inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "overview" ? "border-b-4 border-brand-edge bg-brand text-brand-ink hover:bg-brand-hover" : "text-muted hover:text-ink")}>
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Brand overview
            </button>
            <button type="button" aria-pressed={activeTab === "voice-proof"} onClick={() => setActiveTab("voice-proof")} className={"inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "voice-proof" ? "border-b-4 border-brand-edge bg-brand text-brand-ink hover:bg-brand-hover" : "text-muted hover:text-ink")}>
              <Mic2 className="h-4 w-4" aria-hidden="true" /> Writing voice
            </button>
            <button type="button" aria-pressed={activeTab === "experience"} onClick={() => setActiveTab("experience")} className={"inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:text-sm " + (activeTab === "experience" ? "border-b-4 border-brand-edge bg-brand text-brand-ink hover:bg-brand-hover" : "text-muted hover:text-ink")}>
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Audience &amp; experience
            </button>
          </div>
          <button type="button" aria-expanded={showMoreSettings} onClick={() => setShowMoreSettings((open) => !open)} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            More settings <span className="text-subtle" aria-hidden="true">·</span><span className="hidden text-subtle sm:inline">Idea sources and words to avoid</span><ChevronDown className={"h-4 w-4 transition-transform " + (showMoreSettings ? "rotate-180" : "")} aria-hidden="true" />
          </button>
          {showMoreSettings && <div role="group" aria-label="More brand settings" className="flex w-full max-w-full flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain rounded-2xl border border-line/70 bg-canvas p-1">
            <button type="button" aria-pressed={activeTab === "sources"} onClick={() => setActiveTab("sources")} className={"inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 " + (activeTab === "sources" ? "bg-surface-2 text-ink" : "text-muted hover:text-ink")}><Rss className="h-4 w-4" aria-hidden="true" /> Idea sources</button>
            <button type="button" aria-pressed={activeTab === "lexicon"} onClick={() => setActiveTab("lexicon")} className={"inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 " + (activeTab === "lexicon" ? "bg-surface-2 text-ink" : "text-muted hover:text-ink")}><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Words to avoid ({forbiddenDirectives.filter((d) => isBannedPhrase(d.content)).length})</button>
          </div>}
        </div>
      </div>
      <CompletenessCard version={profileVersion} onGo={(tab) => { setActiveTab(tab); if (tab === "sources" || tab === "lexicon") setShowMoreSettings(true); }} />

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
