"use client";

import { Suspense, useState } from "react";
import { createDirective } from "@/lib/directivesClient";
import { useDirectiveActions } from "@/hooks/useDirectiveActions";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic2, Sparkles, Rss, Users2, Ban, FileUp } from "lucide-react";
import { BrandImportSheet } from "@/components/brandImport/BrandImportSheet";
import { Button } from "@/components/ui/Button";
import { BrandDirectiveItem, BrandTab } from "@/types";
import LexiconTab from "@/components/brand/LexiconTab";
import OverviewTab from "@/components/brand/OverviewTab";
import VoiceProofTab from "@/components/brand/VoiceProofTab";
import SourcesTab from "@/components/brand/SourcesTab";
import ExperienceTab from "@/components/brand/ExperienceTab";
import CompletenessCard from "@/components/brand/CompletenessCard";
import { useApiResource } from "@/hooks/useApiResource";
import { PageHeader } from "@/components/ui/Text";
import { segment } from "@/components/ui/segment";

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
  // The LinkedIn import adds to several tabs at once; remounting them makes each re-read.
  const [importing, setImporting] = useState(false);
  const [importVersion, setImportVersion] = useState(0);
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

  const directiveActions = useDirectiveActions(directives, setDirectives);

  const handleAddBannedWord = async () => {
    const word = newBannedWord.trim();
    if (!word) return;
    setIsAddingBannedWord(true);
    setBannedWordError(null);
    try {
      const created = await createDirective({ category: "FORBIDDEN", key: word, content: word });
      setDirectives((prev) => [created, ...prev]);
      setNewBannedWord("");
    } catch {
      setBannedWordError("Could not add that word. Please try again.");
    } finally {
      setIsAddingBannedWord(false);
    }
  };

  

  return (
    <div className="mx-auto max-w-[1040px] space-y-8">
      <div className="space-y-8">
        <PageHeader
          title="Your brand"
          action={
          <div className="shrink-0">
            <Button variant="soft" icon={<FileUp className="h-4 w-4" />} onClick={() => setImporting(true)} className="w-full sm:w-auto">
              Fill from LinkedIn
            </Button>
            <p className="mt-1.5 text-sm text-muted sm:text-right">Adds what it finds. You check it first.</p>
          </div>
          }
        >
          What Minions knows about you, so every post sounds like you.
        </PageHeader>

        <nav aria-label="Brand settings" className={segment.track}>
          {BRAND_SECTIONS.map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => goToSection(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`inline-flex min-h-9 cursor-pointer items-center gap-2 px-4 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${activeTab === tab ? segment.on : segment.off}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>
          ))}
        </nav>
      </div>
      {importing && (
        <BrandImportSheet
          onClose={() => setImporting(false)}
          onApplied={() => {
            bumpProfile();
            setImportVersion((v) => v + 1);
          }}
        />
      )}
      <div key={importVersion} className="space-y-6">
      {activeTab === "overview" && <CompletenessCard version={profileVersion} onGo={goToSection} />}

      {activeTab === "overview" && <section className="space-y-3">
        <OverviewTab directives={directives} setDirectives={setDirectives} onEditAudience={() => goToSection("experience")} />
      </section>}

      {activeTab === "experience" && <section className="space-y-3">
        <ExperienceTab onChange={bumpProfile} />
      </section>}

      {activeTab === "voice-proof" && <section className="space-y-3">
        <VoiceProofTab />
      </section>}

      {activeTab === "sources" && <section className="space-y-3">
        <SourcesTab />
      </section>}

      {activeTab === "lexicon" && <section className="space-y-3">
        <LexiconTab
          bannedWords={forbiddenDirectives}
          isLoading={directivesLoading}
          isSubmitting={isAddingBannedWord}
          error={bannedWordError}
          newBannedWord={newBannedWord}
          setNewBannedWord={setNewBannedWord}
          onAddBannedWord={handleAddBannedWord}
          onRemoveBannedWord={directiveActions.remove}
        />
      </section>}
      </div>
    </div>
  );
}
