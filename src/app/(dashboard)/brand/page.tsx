"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic2, Sparkles, Rss, Users2, Ban } from "lucide-react";
import { BrandDirectiveItem, BrandTab } from "@/types";
import LexiconTab from "@/components/brand/LexiconTab";
import OverviewTab from "@/components/brand/OverviewTab";
import VoiceProofTab from "@/components/brand/VoiceProofTab";
import SourcesTab from "@/components/brand/SourcesTab";
import ExperienceTab from "@/components/brand/ExperienceTab";
import CompletenessCard from "@/components/brand/CompletenessCard";
import { useApiResource } from "@/hooks/useApiResource";

const BRAND_SECTIONS: { tab: BrandTab; label: string; icon: typeof Sparkles }[] = [
  { tab: "overview", label: "Brand basics", icon: Sparkles },
  { tab: "experience", label: "Audience & experience", icon: Users2 },
  { tab: "voice-proof", label: "Writing voice", icon: Mic2 },
  { tab: "sources", label: "Idea sources", icon: Rss },
  { tab: "lexicon", label: "Words to avoid", icon: Ban },
];

// useSearchParams needs a Suspense boundary on a prerendered route.
export default function BrandStudioPage() {
  return (
    <Suspense>
      <BrandStudio />
    </Suspense>
  );
}

function BrandStudio() {
  const requested = useSearchParams().get("tab");
  const router = useRouter();
  const activeTab = BRAND_SECTIONS.find((item) => item.tab === requested)?.tab ?? "overview";

  const goToSection = (tab: BrandTab) => {
    router.replace(`/brand?tab=${tab}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
  const [bannedWordError, setBannedWordError] = useState<string | null>(null);

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
    setBannedWordError(null);
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
      if (!res.ok) throw new Error("Could not add that word. Please try again.");
      const created: BrandDirectiveItem = await res.json();
      setDirectives((prev) => [created, ...prev]);
      setNewBannedWord("");
    } catch {
      setBannedWordError("Could not add that word. Please try again.");
    } finally {
      setIsAddingBannedWord(false);
    }
  };

  const removeBannedWord = (id: string) => deleteDirective(id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-brand/30 bg-brand/10 text-brand">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-mono tracking-[0.14em] text-brand uppercase">Your voice, your point of view</div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Make every post sound like you</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Choose what to shape next. Your changes guide future drafts.</p>
          </div>
        </div>

        <nav aria-label="Brand settings" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {BRAND_SECTIONS.map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => goToSection(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 text-center text-xs font-semibold transition-colors last:col-span-2 sm:justify-start sm:px-4 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${activeTab === tab ? "border-brand bg-brand text-canvas" : "border-line bg-surface text-muted hover:border-brand/50 hover:text-ink"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>
          ))}
        </nav>
      </div>
      {activeTab === "overview" && <CompletenessCard version={profileVersion} onGo={goToSection} />}

      {activeTab === "overview" && <section className="space-y-3">
        <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="Brand basics" description="What you do, what you talk about, and the principles that make your content yours." />
        <OverviewTab directives={directives} setDirectives={setDirectives} onEditAudience={() => goToSection("experience")} />
      </section>}

      {activeTab === "experience" && <section className="space-y-3">
        <SectionHeading icon={<Users2 className="h-4 w-4" />} title="Audience & experience" description="Help Minions write for the right people and draw on what you have actually learned." />
        <ExperienceTab onChange={bumpProfile} />
      </section>}

      {activeTab === "voice-proof" && <section className="space-y-3">
        <SectionHeading icon={<Mic2 className="h-4 w-4" />} title="Writing voice & proof" description="Set the sound of your writing and the facts future posts are allowed to use." />
        <VoiceProofTab />
      </section>}

      {activeTab === "sources" && <section className="space-y-3">
        <SectionHeading icon={<Rss className="h-4 w-4" />} title="Idea sources" description="Choose the feeds Minions watches for useful, less repetitive ideas." />
        <SourcesTab />
      </section>}

      {activeTab === "lexicon" && <section className="space-y-3">
        <SectionHeading icon={<Ban className="h-4 w-4" />} title="Words & rules to avoid" description="Block words and set guardrails every new draft should follow." />
        <LexiconTab
          bannedWords={forbiddenDirectives}
          isLoading={directivesLoading}
          isSubmitting={isAddingBannedWord}
          error={bannedWordError}
          newBannedWord={newBannedWord}
          setNewBannedWord={setNewBannedWord}
          onAddBannedWord={handleAddBannedWord}
          onRemoveBannedWord={removeBannedWord}
        />
      </section>}
    </div>
  );
}

function SectionHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-line/70 pb-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">{icon}</span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
