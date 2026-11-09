"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Mic2, Plus, ShieldCheck, Trash2 } from "lucide-react";
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

/** "getminions.ai · FAQ", or what is missing. */
function sourceLabel(proof: BrandProofItem): string {
  const url = proof.source_url.trim();
  if (!url) return "No source yet";
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Not a full URL yet; show what was typed.
  }
  return proof.source_title.trim() ? `${host} · ${proof.source_title.trim()}` : host;
}

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

  // Proofs fold to one line; only the one being edited opens.
  const [openProof, setOpenProof] = useState<string | null>(null);

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
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
          {loadError || saveError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-brand" />
              <h2 className="text-base font-bold text-ink">How you write</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Minions copies the wording and rhythm of what you set here.
            </p>
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
              <button type="button" onClick={() => setExamples([""])} className="w-full rounded-xl border border-dashed border-line-strong p-5 text-xs text-muted hover:border-brand/60 hover:text-ink">
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
                  className="w-full resize-y rounded-xl border border-line bg-canvas p-3 pr-10 text-xs leading-relaxed text-ink outline-none placeholder:text-subtle focus:border-brand"
                />
                <button type="button" onClick={() => setExamples(examples.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 rounded-lg p-1.5 text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`Remove sample ${index + 1}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-ink">Phrases you naturally use</h3>
            <div className="flex flex-wrap gap-1.5">
              {questionnaire.signature_phrases.map((phrase) => (
                <button key={phrase} type="button" onClick={() => setQuestionnaire({ ...questionnaire, signature_phrases: questionnaire.signature_phrases.filter((item) => item !== phrase) })} className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-ink hover:border-danger/40" title="Remove phrase">
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
              <ShieldCheck className="h-4 w-4 text-coral" />
              <h2 className="text-base font-bold text-ink">Facts you can prove</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Posts may state these as facts. Each one needs a source; any other fact in a draft is flagged for you to check.
            </p>
          </div>

          {proofs.length > 0 && (
            <ul className="space-y-2">
              {proofs.map((proof, index) => {
                const isOpen = openProof === proof.id;
                const update = (patch: Partial<BrandProofItem>) => setProofs(proofs.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
                return (
                  <li key={proof.id} className="rounded-xl border border-line bg-surface-2">
                    <div className="flex items-start gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setOpenProof(isOpen ? null : proof.id)}
                        aria-expanded={isOpen}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <p className={`text-xs leading-relaxed ${proof.claim.trim() ? "text-ink" : "text-subtle"}`}>{proof.claim.trim() || "New fact"}</p>
                        <p className="mt-0.5 truncate text-[11px] text-subtle">{sourceLabel(proof)}</p>
                      </button>
                      <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                      <button type="button" onClick={() => setProofs(proofs.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-1 text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`Remove fact ${index + 1}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="space-y-2 border-t border-line px-3 pb-3 pt-2">
                        <label htmlFor={`proof-claim-${proof.id}`} className="block text-xs font-semibold text-muted">The fact</label>
                        <textarea id={`proof-claim-${proof.id}`} rows={2} value={proof.claim} onChange={(event) => update({ claim: event.target.value })} placeholder="Exactly what the source supports" className="w-full resize-y rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink outline-none placeholder:text-subtle focus:border-brand" />
                        <label htmlFor={`proof-url-${proof.id}`} className="block text-xs font-semibold text-muted">Where it says so</label>
                        <input id={`proof-url-${proof.id}`} type="url" value={proof.source_url} onChange={(event) => update({ source_url: event.target.value })} placeholder="https://source.example/report" className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink outline-none placeholder:text-subtle focus:border-brand" />
                        <label htmlFor={`proof-title-${proof.id}`} className="block text-xs font-semibold text-muted">Page name (optional)</label>
                        <input id={`proof-title-${proof.id}`} value={proof.source_title} onChange={(event) => update({ source_title: event.target.value })} placeholder="Page name" className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink outline-none placeholder:text-subtle focus:border-brand" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <button type="button" disabled={proofs.length >= 10} onClick={() => {
            const proof = newProof();
            setProofs([...proofs, proof]);
            setOpenProof(proof.id);
          }} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-3 text-xs font-semibold text-muted hover:border-coral/60 hover:text-ink disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Add a fact with its source
          </button>

        </section>
      </div>

      {/* Shown only with something to save, as a small floating bar instead of a full-width one. */}
      {(isDirty || saving || saved) && (
        <div className="pointer-events-none sticky bottom-4 flex justify-end">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-2 pl-4 shadow-2xl backdrop-blur">
            {saved && !isDirty ? (
              <span role="status" className="inline-flex items-center gap-1 pr-2 text-xs text-success"><Check className="h-3.5 w-3.5" /> Saved. New drafts use it.</span>
            ) : (
              <>
                <span className="text-xs text-gold">Unsaved changes</span>
                <button type="button" onClick={save} disabled={saving} aria-busy={saving} className={buttonStyles({ size: "sm" })}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
