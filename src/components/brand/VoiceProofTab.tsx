"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import type { BrandProofItem, BrandVoiceProofSettings, BrandVoiceQuestionnaire } from "@/types";
import { Button } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
import { inputClass } from "@/components/ui/fieldStyles";
import { BrandCard, Chip, brandText } from "@/components/brand/parts";
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

/**
 * Voice and proof are one saved record, shown as two Advanced pages: `show`
 * picks which half is on screen. Saving either sends both, untouched.
 */
export default function VoiceProofTab({ show }: { show: "voice" | "proof" }) {
  const { data, isLoading, error: loadError } = useApiResource<BrandVoiceProofSettings | null>(
    "/api/brand/voice-proof",
    null,
    { errorMessage: "Could not load voice and proof settings" }
  );

  if (isLoading || !data) return <LoadingState label="Loading…" />;
  return <VoiceProofEditor show={show} initialData={data} loadError={loadError} />;
}

function VoiceProofEditor({ show, initialData, loadError }: { show: "voice" | "proof"; initialData: BrandVoiceProofSettings; loadError: string | null }) {
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

  const voice = (
    <BrandCard title="How you write" line="Minions copies the wording and rhythm of what you set here.">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className={brandText.label}>Writing samples</h3>
            <p className={brandText.note}>Up to five posts, emails or notes you really wrote. One is enough to start.</p>
          </div>
          {examples.length > 0 && examples.length < 5 && (
            <button type="button" onClick={() => setExamples([...examples, ""])} className={brandText.link}>Add another</button>
          )}
        </div>
        {examples.length === 0 && (
          <button type="button" onClick={() => setExamples([""])} className={`${brandText.row} ${brandText.link} w-full text-left`}>
            Paste your first sample
          </button>
        )}
        {examples.map((example, index) => (
          <div key={index} className="relative">
            <textarea
              rows={4}
              aria-label={`Writing sample ${index + 1}`}
              value={example}
              onChange={(event) => setExamples(examples.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
              placeholder="Paste something that sounds unmistakably like you…"
              className={`${inputClass} resize-y pr-12`}
            />
            <button type="button" onClick={() => setExamples(examples.filter((_, itemIndex) => itemIndex !== index))} className={`${brandText.iconButton} absolute right-1.5 top-1.5`} aria-label={`Remove sample ${index + 1}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <label key={option.key} className="space-y-2">
            <span className={brandText.label}>{option.label}</span>
            <select value={questionnaire[option.key]} onChange={(event) => setQuestionnaire({ ...questionnaire, [option.key]: event.target.value })} className={`${inputClass} cursor-pointer`}>
              {option.choices.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="signature-phrase" className={brandText.label}>Phrases you naturally use</label>
        {questionnaire.signature_phrases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {questionnaire.signature_phrases.map((phrase) => (
              <Chip key={phrase} removeLabel={`Remove ${phrase}`} onRemove={() => setQuestionnaire({ ...questionnaire, signature_phrases: questionnaire.signature_phrases.filter((item) => item !== phrase) })}>
                {phrase}
              </Chip>
            ))}
          </div>
        )}
        {questionnaire.signature_phrases.length < 8 && (
          <div className="flex gap-2">
            <input id="signature-phrase" value={signatureDraft} onChange={(event) => setSignatureDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addSignaturePhrase())} placeholder="e.g. Here’s the practical part" className={`${inputClass} min-w-0 flex-1`} />
            <Button variant="secondary" onClick={addSignaturePhrase} disabled={!signatureDraft.trim()}>Add</Button>
          </div>
        )}
      </div>
    </BrandCard>
  );

  const proof = (
    <BrandCard title="Facts you can prove" line="Posts may state these as facts. Each needs a source; any other fact in a draft is flagged for you to check.">
      {proofs.length > 0 && (
        <ul className="space-y-2">
          {proofs.map((item, index) => {
            const isOpen = openProof === item.id;
            const update = (patch: Partial<BrandProofItem>) => setProofs(proofs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
            return (
              <li key={item.id} className="rounded-2xl bg-surface-2">
                <div className="flex items-start gap-1 py-2 pl-4 pr-2">
                  <button type="button" onClick={() => setOpenProof(isOpen ? null : item.id)} aria-expanded={isOpen} className="min-w-0 flex-1 cursor-pointer py-1.5 text-left">
                    <p className={`text-[15px] leading-relaxed ${item.claim.trim() ? "text-ink" : "text-subtle"}`}>{item.claim.trim() || "New fact"}</p>
                    <p className="mt-0.5 truncate text-sm text-subtle">{sourceLabel(item)}</p>
                  </button>
                  <button type="button" onClick={() => setProofs(proofs.filter((_, i) => i !== index))} className={brandText.iconButton} aria-label={`Remove fact ${index + 1}`}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-2 px-4 pb-4">
                    <label htmlFor={`proof-claim-${item.id}`} className={brandText.label}>The fact</label>
                    <textarea id={`proof-claim-${item.id}`} rows={2} value={item.claim} onChange={(event) => update({ claim: event.target.value })} placeholder="Exactly what the source supports" className={`${inputClass} resize-y`} />
                    <label htmlFor={`proof-url-${item.id}`} className={brandText.label}>Where it says so</label>
                    <input id={`proof-url-${item.id}`} type="url" value={item.source_url} onChange={(event) => update({ source_url: event.target.value })} placeholder="https://source.example/report" className={inputClass} />
                    <label htmlFor={`proof-title-${item.id}`} className={brandText.label}>Page name <span className="font-normal text-subtle">optional</span></label>
                    <input id={`proof-title-${item.id}`} value={item.source_title} onChange={(event) => update({ source_title: event.target.value })} placeholder="Page name" className={inputClass} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {proofs.length < 10 && (
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              const added = newProof();
              setProofs([...proofs, added]);
              setOpenProof(added.id);
            }}
          >
            Add a fact
          </Button>
        </div>
      )}
    </BrandCard>
  );

  return (
    <div className="space-y-6">
      {(loadError || saveError) && <ErrorLine text={loadError || saveError || ""} />}
      {show === "voice" ? voice : proof}

      {/* Shown only with something to save, floating so it is in reach on a long page. */}
      {(isDirty || saving || saved) && (
        <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-surface p-1.5 pl-5 shadow-float">
            {saved && !isDirty ? (
              <span role="status" className="py-2 pr-4 text-[15px] text-success">Saved. New drafts use it.</span>
            ) : (
              <>
                <span className="text-[15px] text-muted">Unsaved changes</span>
                <Button onClick={save} loading={saving}>Save</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
