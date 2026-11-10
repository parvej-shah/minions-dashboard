"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { createDirective } from "@/lib/directivesClient";
import { useDirectiveActions } from "@/hooks/useDirectiveActions";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient } from "@/lib/api-client";
import { ADVANCED_SECTIONS, SECTION_PAGES, resolveBrandSection, type BrandSection } from "@/lib/brandSections";
import type { BrandCompleteness, BrandDirectiveItem, BrandSettings, IcpProfileItem } from "@/types";
import { BrandImportSheet } from "@/components/brandImport/BrandImportSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Text";
import { BrandCard } from "@/components/brand/parts";
import CoverAppearanceCard from "@/components/brand/CoverAppearanceCard";
import CoverThemeCard from "@/components/brand/CoverThemeCard";
import IcpEditor from "@/components/brand/IcpEditor";
import LexiconTab from "@/components/brand/LexiconTab";
import MemorySection from "@/components/brand/MemorySection";
import PositioningCard from "@/components/brand/PositioningCard";
import SourcesTab from "@/components/brand/SourcesTab";
import TagList from "@/components/brand/TagList";
import VoiceProofTab from "@/components/brand/VoiceProofTab";
import VoiceRulesCard from "@/components/brand/VoiceRulesCard";
import WeeklyUpdatesPanel from "@/components/pulse/WeeklyUpdatesPanel";

/** `?tab=advanced` is the basics with the Advanced list open: where "back" from a section lands. */
const ADVANCED_OPEN = "advanced";

// useSearchParams needs a Suspense boundary on a prerendered route.
export default function BrandPage() {
  return (
    <Suspense>
      <Brand />
    </Suspense>
  );
}

/**
 * Basics first: the four things a post cannot be written without, and the
 * cover look every post carries. Everything
 * else is one row under Advanced and opens as its own page (src/lib/brandSections.ts).
 */
function Brand() {
  const tab = useSearchParams().get("tab");
  const section = resolveBrandSection(tab);
  const router = useRouter();
  const open = (next: BrandSection) => router.push(next === "basics" ? "/brand" : `/brand?tab=${next}`);

  // Bumped after an edit, so the "one thing missing" line re-reads.
  const [profileVersion, setProfileVersion] = useState(0);
  const bumpProfile = () => setProfileVersion((v) => v + 1);
  // The LinkedIn import adds to several cards at once; remounting them makes each re-read.
  const [importing, setImporting] = useState(false);
  const [importVersion, setImportVersion] = useState(0);

  const { data: directives, isLoading: directivesLoading, setData: setDirectives } = useApiResource<BrandDirectiveItem[]>("/api/brand/directives", [], {
    errorMessage: "Could not load your brand rules",
  });
  const { data: profile, setData: setProfile } = useApiResource<BrandSettings | null>("/api/brand", null, { errorMessage: "Could not load your brand" });
  const directiveActions = useDirectiveActions(directives, setDirectives);
  const active = (category: BrandDirectiveItem["category"]) => directives.filter((d) => d.category === category && d.is_active);

  // Words to avoid are the FORBIDDEN rules the drafting pipeline reads, not a separate list.
  const [newBannedWord, setNewBannedWord] = useState("");
  const [isAddingBannedWord, setIsAddingBannedWord] = useState(false);
  const [bannedWordError, setBannedWordError] = useState<string | null>(null);
  const addBannedWord = async () => {
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

  if (section !== "basics") {
    const meta = SECTION_PAGES.find((s) => s.id === section)!;
    return (
      <div className="mx-auto max-w-[760px] space-y-8">
        <div className="space-y-4">
          <Link href={meta.advanced ? `/brand?tab=${ADVANCED_OPEN}` : "/brand"} className="inline-flex min-h-9 items-center gap-1 text-[15px] text-brand hover:underline">
            <span aria-hidden="true">‹</span> Your brand
          </Link>
          <PageHeader title={meta.title}>{meta.line}</PageHeader>
        </div>
        <div className="space-y-6">
          {section === "voice" && (
            <>
              <VoiceProofTab show="voice" />
              <VoiceRulesCard profile={profile} setProfile={setProfile} directives={directives} setDirectives={setDirectives} onAdd={directiveActions.add} onRemove={directiveActions.remove} />
            </>
          )}
          {section === "reader" && <IcpEditor onChange={bumpProfile} />}
          {section === "experience" && (
            <>
              <MemorySection onChange={bumpProfile} />
              <WeeklyUpdatesPanel />
            </>
          )}
          {section === "proof" && (
            <>
              <VoiceProofTab show="proof" />
              <BrandCard title="What sets you apart" line="What you do differently. Posts lean on these when they compare.">
                <TagList rows category="POSITIONING" items={active("POSITIONING")} onAdd={directiveActions.add} onRemove={directiveActions.remove} placeholder="e.g. We answer every call in under two rings" />
              </BrandCard>
            </>
          )}
          {section === "avoid" && (
            <LexiconTab
              bannedWords={directives.filter((d) => d.category === "FORBIDDEN")}
              isLoading={directivesLoading}
              isSubmitting={isAddingBannedWord}
              error={bannedWordError}
              newBannedWord={newBannedWord}
              setNewBannedWord={setNewBannedWord}
              onAddBannedWord={addBannedWord}
              onRemoveBannedWord={directiveActions.remove}
            />
          )}
          {section === "sources" && <SourcesTab />}
          {section === "cover" && <CoverAppearanceCard profile={profile} setProfile={setProfile} />}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-8">
      <PageHeader
        title="Your brand"
        action={
          <Button variant="soft" onClick={() => setImporting(true)}>
            Fill from LinkedIn
          </Button>
        }
      >
        What Minions knows about you, so every post sounds like you.
      </PageHeader>

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
        <MissingBasic version={profileVersion} />
        <WhatYouDo profile={profile} setProfile={setProfile} onSaved={bumpProfile} version={profileVersion} />
        <IcpEditor fields="who" onChange={bumpProfile} onMore={() => open("reader")} />
        <BrandCard title="What you post about" line="Ideas stay on these topics.">
          <TagList category="TOPICS" items={active("TOPICS")} onAdd={directiveActions.add} onRemove={directiveActions.remove} placeholder="Add a topic, e.g. Hiring your first salesperson" />
        </BrandCard>
        <MemorySection compact onChange={bumpProfile} onSeeAll={() => open("experience")} />
        <CoverThemeCard profile={profile} setProfile={setProfile} onEdit={() => open("cover")} />
      </div>

      <Advanced startOpen={tab === ADVANCED_OPEN} onOpen={open} />
    </div>
  );
}

/** "What you do", which needs the reader's line to spot a positioning that only repeats it. */
function WhatYouDo({ profile, setProfile, onSaved, version }: { profile: BrandSettings | null; setProfile: (p: BrandSettings) => void; onSaved: () => void; version: number }) {
  const [audience, setAudience] = useState("");
  useEffect(() => {
    let live = true;
    apiClient
      .get<IcpProfileItem>("/api/brand/icp")
      .then((icp) => live && setAudience(icp?.who ?? ""))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [version]);
  return <PositioningCard profile={profile} setProfile={setProfile} audience={audience} onSaved={onSaved} />;
}

/** One quiet line, only while a basic is missing. Advanced gaps never nag. */
function MissingBasic({ version }: { version: number }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    apiClient
      .get<BrandCompleteness>("/api/brand/completeness")
      .then((d) => live && setText(d.next?.text ?? null))
      // Advisory only: a failed load shows nothing rather than blocking the page.
      .catch(() => live && setText(null));
    return () => {
      live = false;
    };
  }, [version]);
  if (!text) return null;
  return (
    <Card tone="brand" pad="none" className="px-6 py-4 sm:px-8">
      <p className="text-[15px] leading-relaxed text-ink">
        <span className="font-medium text-brand">One thing missing.</span> {text}
      </p>
    </Card>
  );
}

/** Closed by default: someone happy with the basics never has to read it. */
function Advanced({ startOpen, onOpen }: { startOpen: boolean; onOpen: (section: BrandSection) => void }) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const box = useRef<HTMLElement>(null);
  // Coming back from a section, land on the list rather than the top of the page.
  useEffect(() => {
    if (startOpen) box.current?.scrollIntoView({ block: "start" });
  }, [startOpen]);

  return (
    <section ref={box} aria-label="Advanced" className="scroll-mt-6">
      <Card pad="none" className="overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-8"
        >
          <span className="min-w-0">
            <span className="block text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">Advanced</span>
            <span className="mt-1 block text-[15px] leading-relaxed text-muted">Optional. Posts work without these; they make them sound more like you.</span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {isOpen && (
          <ul>
            {ADVANCED_SECTIONS.map((s) => (
              <li key={s.id} className="border-t border-line">
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-8"
                >
                  <span className="min-w-0">
                    <span className="block text-[17px] text-ink">{s.title}</span>
                    <span className="block text-[15px] text-muted">{s.line}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-subtle" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
