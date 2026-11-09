"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useBrandImport } from "@/hooks/useBrandImport";
import type { BrandImport, ImportApproval } from "@/lib/brandImport/types";
import { ImportDrop, type DroppedProfile } from "./ImportDrop";
import { ImportLive } from "./ImportLive";
import { ImportReview } from "./ImportReview";

/**
 * The Brand page's "Fill from LinkedIn": the onboarding import, run again on
 * an existing brand. It only offers what the brand does not have yet, and
 * saving adds to the brand; nothing the author set is overwritten.
 */

type Stage = "drop" | "reading" | "review" | "saved";

interface ApplyResult {
  audience: boolean;
  experience_saved: number;
  proofs_saved: number;
  voice_set: boolean;
  sample_saved: boolean;
}

function approvalOf(found: BrandImport, approvedProofs: string[], keepVoice: boolean): ImportApproval {
  return {
    icp: found.icp,
    experience: found.experience.map(({ kind, content }) => ({ kind, content })),
    proofs: found.proofs.filter((p) => approvedProofs.includes(p.id)).map(({ claim, source_url, source_title }) => ({ claim, source_url, source_title })),
    voice: keepVoice ? found.voice : null,
    headline: found.identity?.headline || null,
  };
}

function savedSummary(result: ApplyResult): string[] {
  return [
    result.experience_saved ? `${result.experience_saved} experience item${result.experience_saved === 1 ? "" : "s"}` : "",
    result.audience ? "your audience" : "",
    result.proofs_saved ? `${result.proofs_saved} proof${result.proofs_saved === 1 ? "" : "s"}` : "",
    result.voice_set ? "your voice" : "",
    result.sample_saved ? "a writing sample" : "",
  ].filter(Boolean);
}

export function BrandImportSheet({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const run = useBrandImport("/api/brand/import");
  const [stage, setStage] = useState<Stage>("drop");
  const [profile, setProfile] = useState<DroppedProfile | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [approvedProofs, setApprovedProofs] = useState<string[]>([]);
  const [keepVoice, setKeepVoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ApplyResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ company_domain?: string }>("/api/brand")
      .then((brand) => {
        if (!cancelled && brand?.company_domain) setWebsiteUrl((url) => url || brand.company_domain || "");
      })
      .catch(() => {});
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, saving]);

  const found = run.result;
  const nothingNew = run.status === "done" && !found.icp && !found.voice && !found.experience.length && !found.proofs.length;

  const read = () => {
    setError(null);
    setApprovedProofs([]);
    void run.start({ profileText: profile?.text ?? "", websiteUrl: websiteUrl.trim() });
    setStage("reading");
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await apiClient.post<ApplyResult>("/api/brand/import/apply", approvalOf(found, approvedProofs, keepVoice));
      setSaved(result);
      setStage("saved");
      onApplied();
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't save that. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  let body: React.ReactNode;
  let action: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean };

  switch (stage) {
    case "drop":
      body = (
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10 sm:px-6">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Fill your brand from LinkedIn</h1>
          <p className="mt-2 text-muted">Minions reads your profile and site and adds what your brand is missing. You check everything first, and nothing you set is replaced.</p>
          <div className="mt-6">
            <ImportDrop profile={profile} onProfile={setProfile} websiteUrl={websiteUrl} onWebsiteUrl={setWebsiteUrl} />
          </div>
        </div>
      );
      action = { label: "Read my profile", onClick: read, disabled: !profile && websiteUrl.trim().length < 4 };
      break;
    case "reading":
      body = <ImportLive run={run} hadWebsite={Boolean(websiteUrl.trim())} />;
      action = nothingNew
        ? { label: "Close", onClick: onClose }
        : run.status === "error"
          ? { label: "Try again", onClick: read }
          : { label: run.status === "done" ? "Check it over" : "Reading…", onClick: () => setStage("review"), disabled: run.status !== "done", loading: run.status === "reading" };
      break;
    case "review":
      body = (
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10 sm:px-6">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">New for your brand</h1>
          <p className="mt-2 text-muted">Only things your brand doesn’t have yet. Drop anything that’s off; it’s added when you save.</p>
          <div className="mt-6">
            <ImportReview
              result={found}
              onChange={run.setResult}
              approvedProofs={approvedProofs}
              onToggleProof={(id) => setApprovedProofs((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))}
              keepVoice={keepVoice}
              onKeepVoice={setKeepVoice}
              showFocus={false}
            />
          </div>
        </div>
      );
      action = { label: "Add to my brand", onClick: () => void save(), loading: saving };
      break;
    default: {
      const parts = saved ? savedSummary(saved) : [];
      body = (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <span className="story-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
            <PartyPopper className="h-11 w-11" strokeWidth={2.25} />
          </span>
          <h1 className="mt-8 text-2xl font-bold text-ink sm:text-3xl">{parts.length ? "Your brand just got richer" : "Nothing needed saving"}</h1>
          <p className="mt-2 max-w-md text-muted">{parts.length ? `Added ${parts.join(", ")}. Your next ideas and drafts use it.` : "Everything was already in your brand."}</p>
        </div>
      );
      action = { label: "Done", onClick: onClose };
    }
  }

  const back = stage === "review" ? () => setStage("reading") : stage === "reading" ? () => (run.reset(), setStage("drop")) : null;
  const message = error ?? (stage === "reading" ? (run.status === "error" ? run.error : nothingNew ? "Nothing new: your brand already has everything Minions found." : null) : null);

  // Rendered into <body> so the page's layout (e.g. a space-y parent's margin) can't shift the overlay.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Fill your brand from LinkedIn" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-canvas text-ink">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas px-4 py-3 sm:px-6">
        {back ? (
          <button type="button" onClick={back} aria-label="Back" className="rounded-xl p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer">
            <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-xl p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer">
          <X className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </header>
      <main className="flex flex-1 flex-col">{body}</main>
      <footer className="sticky bottom-0 border-t border-line bg-canvas">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p role={error || run.status === "error" ? "alert" : undefined} className={`text-sm font-bold ${error || run.status === "error" ? "text-danger" : "text-muted"}`}>
            {message}
          </p>
          <Button size="lg" shout block onClick={action.onClick} disabled={action.disabled} loading={action.loading} className="sm:w-auto sm:min-w-48">
            {action.label}
          </Button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
