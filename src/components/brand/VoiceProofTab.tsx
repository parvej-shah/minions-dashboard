"use client";

import { useMemo, useState } from "react";
import { Check, FileCheck2, Loader2, Mic2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import type { BrandProofItem, BrandVoiceProofSettings, BrandVoiceQuestionnaire } from "@/types";

import { buttonStyles } from "@/components/ui/Button";
const EMPTY_PROOF: BrandProofItem = { id: "", claim: "", source_url: "", source_title: "", notes: "" };

const OPTIONS: Array<{
  key: Exclude<keyof BrandVoiceQuestionnaire, "signature_phrases">;
  label: string;
  choices: Array<{ value: string; label: string }>;
}> = [
  { key: "formality", label: "Formality", choices: [{ value: "casual", label: "Casual" }, { value: "balanced", label: "Balanced" }, { value: "formal", label: "Formal" }] },
  { key: "sentence_length", label: "Sentence length", choices: [{ value: "short", label: "Short" }, { value: "mixed", label: "Mixed" }, { value: "long", label: "Long" }] },
  { key: "humor", label: "Humor", choices: [{ value: "none", label: "None" }, { value: "light", label: "Light" }, { value: "frequent", label: "Frequent" }] },
  { key: "emoji_use", label: "Emoji use", choices: [{ value: "never", label: "Never" }, { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" }] },
];

function newProof(): BrandProofItem {
  return { ...EMPTY_PROOF, id: `new-${crypto.randomUUID()}` };
}

export default function VoiceProofTab() {
  const { data, isLoading, error: loadError } = useApiResource<BrandVoiceProofSettings | null>(
    "/api/brand/voice-proof",
    null,
    { errorMessage: "Could not load voice and proof settings" }
  );

  if (isLoading || !data) return <LoadingState label="Loading your voice…" />;
  return <VoiceProofEditor initialData={data} loadError={loadError} />;
}

function VoiceProofEditor({ initialData, loadError }: { initialData: BrandVoiceProofSettings; loadError: string | null }) {
  const [questionnaire, setQuestionnaire] = useState<BrandVoiceQuestionnaire>(initialData.questionnaire);
  const [examples, setExamples] = useState<string[]>(initialData.examples.map((item) => item.content));
  const [proofs, setProofs] = useState<BrandProofItem[]>(initialData.proofs);
  const [signatureDraft, setSignatureDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({
    questionnaire: initialData.questionnaire,
    examples: initialData.examples.map((item) => item.content),
    proofs: initialData.proofs,
  }));
  const currentSnapshot = JSON.stringify({ questionnaire, examples, proofs });
  const isDirty = currentSnapshot !== savedSnapshot;

  const voiceScore = useMemo(() => {
    const usefulSamples = examples.filter((item) => item.trim().length >= 100).length;
    const sampleCharacters = examples.reduce((sum, item) => sum + item.trim().length, 0);
    return Math.min(100, 30 + usefulSamples * 14 + Math.min(30, Math.floor(sampleCharacters / 100)));
  }, [examples]);

  const addSignaturePhrase = () => {
    const phrase = signatureDraft.trim();
    if (!questionnaire || !phrase || questionnaire.signature_phrases.length >= 8) return;
    setQuestionnaire({ ...questionnaire, signature_phrases: [...questionnaire.signature_phrases, phrase] });
    setSignatureDraft("");
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await apiClient.put("/api/brand/voice-proof", { questionnaire, examples, proofs });
      setSavedSnapshot(currentSnapshot);
      setSaved(true);
    } catch (err) {
      setSaveError(toErrorMessage(err, "Could not save voice and proof settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {(loadError || saveError) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
          {loadError || saveError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-brand" />
                <h2 className="text-base font-bold text-ink">Your writing fingerprint</h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                These choices and samples guide wording, rhythm, and personality on every platform.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-bold text-brand">{voiceScore}%</div>
              <div className="text-[10px] uppercase tracking-wider text-subtle">voice signal</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {OPTIONS.map((option) => (
              <label key={option.key} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted">{option.label}</span>
                <select
                  value={questionnaire[option.key]}
                  onChange={(event) => setQuestionnaire({ ...questionnaire, [option.key]: event.target.value })}
                  className="min-h-11 w-full cursor-pointer rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
                >
                  {option.choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Writing samples</h3>
                <p className="text-[11px] text-subtle">Add up to five posts, emails, or notes you genuinely wrote.</p>
              </div>
              <button
                type="button"
                disabled={examples.length >= 5}
                onClick={() => setExamples([...examples, ""])}
                className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-[11px] font-semibold text-brand disabled:opacity-40"
              >
                <Plus className="h-3 w-3" /> Add sample
              </button>
            </div>
            {examples.length === 0 && (
              <button type="button" onClick={() => setExamples([""])} className="w-full rounded-xl border border-dashed border-[#334155] p-5 text-xs text-muted hover:border-brand/60 hover:text-ink">
                Add your first writing sample
              </button>
            )}
            {examples.map((example, index) => (
              <div key={index} className="relative">
                <textarea
                  rows={4}
                  aria-label={`Writing sample ${index + 1}`}
                  value={example}
                  onChange={(event) => setExamples(examples.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                  placeholder="Paste something that sounds unmistakably like you…"
                  className="w-full resize-y rounded-xl border border-line bg-canvas p-3 pr-10 text-xs leading-relaxed text-ink outline-none placeholder:text-[#475569] focus:border-brand"
                />
                <button type="button" onClick={() => setExamples(examples.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 rounded-lg p-1.5 text-subtle hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove sample ${index + 1}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-ink">Phrases you naturally use</h3>
            <div className="flex flex-wrap gap-1.5">
              {questionnaire.signature_phrases.map((phrase) => (
                <button key={phrase} type="button" onClick={() => setQuestionnaire({ ...questionnaire, signature_phrases: questionnaire.signature_phrases.filter((item) => item !== phrase) })} className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-ink hover:border-red-500/40" title="Remove phrase">
                  {phrase} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <label htmlFor="signature-phrase" className="sr-only">Phrase you naturally use</label>
              <input id="signature-phrase" value={signatureDraft} onChange={(event) => setSignatureDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addSignaturePhrase())} placeholder="e.g. Here’s the practical part" className="min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-brand" />
              <button type="button" onClick={addSignaturePhrase} aria-label="Add phrase" disabled={!signatureDraft.trim() || questionnaire.signature_phrases.length >= 8} className="rounded-lg border border-line bg-surface-2 px-3 text-muted hover:text-ink"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FF7A59]" />
              <h2 className="text-base font-bold text-ink">Proof library</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Claims here may be used as facts. Every claim needs a source; anything else stays blocked for review.
            </p>
          </div>

          {proofs.map((proof, index) => (
            <div key={proof.id} className="rounded-xl border border-line bg-[#0B1016] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand"><FileCheck2 className="h-3.5 w-3.5" /> Proof {index + 1}</span>
                <button type="button" onClick={() => setProofs(proofs.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-1.5 text-subtle hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove proof ${index + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <label htmlFor={`proof-claim-${proof.id}`} className="block text-xs font-semibold text-muted">Claim this source supports</label>
              <textarea id={`proof-claim-${proof.id}`} rows={3} value={proof.claim} onChange={(event) => setProofs(proofs.map((item, itemIndex) => itemIndex === index ? { ...item, claim: event.target.value } : item))} placeholder="Exact claim this source supports" className="w-full resize-y rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink outline-none placeholder:text-[#475569] focus:border-brand" />
              <label htmlFor={`proof-url-${proof.id}`} className="block text-xs font-semibold text-muted">Source URL</label>
              <input id={`proof-url-${proof.id}`} type="url" value={proof.source_url} onChange={(event) => setProofs(proofs.map((item, itemIndex) => itemIndex === index ? { ...item, source_url: event.target.value } : item))} placeholder="https://source.example/report" className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink outline-none placeholder:text-[#475569] focus:border-brand" />
              <label htmlFor={`proof-title-${proof.id}`} className="block text-xs font-semibold text-muted">Source title (optional)</label>
              <input id={`proof-title-${proof.id}`} value={proof.source_title} onChange={(event) => setProofs(proofs.map((item, itemIndex) => itemIndex === index ? { ...item, source_title: event.target.value } : item))} placeholder="Source title (optional)" className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink outline-none placeholder:text-[#475569] focus:border-brand" />
            </div>
          ))}

          <button type="button" disabled={proofs.length >= 10} onClick={() => setProofs([...proofs, newProof()])} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#334155] py-3 text-xs font-semibold text-muted hover:border-[#FF7A59]/60 hover:text-ink disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Add a sourced claim
          </button>

          <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-[11px] leading-relaxed text-muted">
            <span className="font-semibold text-brand">Safety rule:</span> generated links never count as proof. Only sources you approve here can unlock a factual claim.
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-line bg-[#0D1520]/95 p-3 shadow-2xl backdrop-blur">
        {saved && !isDirty && <span role="status" className="inline-flex items-center gap-1 text-xs text-emerald-400"><Check className="h-3.5 w-3.5" /> Saved to future drafts</span>}
        <button type="button" onClick={save} disabled={saving || !isDirty} aria-busy={saving} className={buttonStyles({ size: "md" })}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save voice & proof
        </button>
      </div>
    </div>
  );
}
