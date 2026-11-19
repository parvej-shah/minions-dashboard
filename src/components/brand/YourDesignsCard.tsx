"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Plus, Upload } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { contractPrompt } from "@/lib/covers/custom/contract";
import { Button, buttonStyles } from "@/components/ui/Button";
import Segmented from "@/components/ui/Segmented";
import { readDesignFile } from "@/lib/covers/custom/importFile";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ErrorLine from "@/components/ui/ErrorLine";
import { inputClass } from "@/components/ui/fieldStyles";
import { GroupedList, ListRow, Switch } from "@/components/ui/List";
import Modal from "@/components/ui/Modal";
import { BrandCard, brandText } from "@/components/brand/parts";

interface Design {
  id: string;
  name: string;
  version: number;
  preview_svg: string | null;
}
interface Preview {
  name: "short" | "long" | "bare";
  svg: string;
}
type StandIn = "photo" | "cutout";
type Checked = { ok: true; name: string; previews: Preview[]; stand_ins: StandIn[] } | { ok: false; errors: string[] };

/** The one line under the preview when a grey figure stands in for a picture the brand has not added. */
function standInNote(slots: StandIn[]): string | null {
  if (!slots.length) return null;
  const what = slots.length === 2 ? "your photo and cut-out" : slots[0] === "photo" ? "your photo" : "your cut-out";
  return `A grey figure stands in for ${what}. Add ${slots.length === 2 ? "them" : "it"} on the Brand page to see your own.`;
}

/** The server draws a design as SVG; shown through <img>, so nothing in it can run in the page. */
const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * Your own cover designs: paste one, see exactly what breaks the contract or
 * three previews, save only when it passes. The server checks everything again
 * on save; this screen never decides what is safe.
 */
export default function YourDesignsCard() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<Design | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    apiClient
      .get<{ templates: Design[]; only_mine: boolean }>("/api/cover-templates")
      .then((r) => {
        if (!live) return;
        setDesigns(r.templates);
        setOnlyMine(r.only_mine);
      })
      .catch((e) => live && setError(toErrorMessage(e, "Couldn't load your designs.")))
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [version]);

  const toggle = async (next: boolean) => {
    setOnlyMine(next);
    try {
      await apiClient.patch("/api/cover-templates/settings", { only_mine: next });
    } catch (e) {
      setOnlyMine(!next);
      setError(toErrorMessage(e, "Couldn't change that."));
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await apiClient.delete(`/api/cover-templates/${removing.id}`);
      setRemoving(null);
      reload();
    } catch (e) {
      setRemoving(null);
      setError(toErrorMessage(e, "Couldn't remove it."));
    }
  };

  return (
    <BrandCard
      title="Your own designs"
      line={designs.length ? "Your posts use these." : "Paste a design and your posts use it."}
      action={<Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setOpen(true)}>Add a design</Button>}
    >
      {error && <ErrorLine text={error} />}
      {loaded && designs.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {designs.map((d) => (
              <li key={d.id} className="space-y-2">
                <div className="aspect-[4/5] overflow-hidden rounded-xl border border-line bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.preview_svg && <img src={svgSrc(d.preview_svg)} alt={d.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-ink">{d.name}</span>
                  <button type="button" onClick={() => setRemoving(d)} className="cursor-pointer text-sm text-subtle hover:text-danger">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <GroupedList>
            <ListRow label="Use only my designs" hint="Off: they alternate with ours." trailing={<Switch checked={onlyMine} onChange={toggle} label="Use only my designs" />} />
          </GroupedList>
        </>
      )}
      <AddDesign isOpen={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); reload(); }} />
      <ConfirmModal
        isOpen={removing !== null}
        title="Remove this design?"
        description="New posts stop using it. Posts already made with it stay as they are."
        confirmLabel="Remove"
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </BrandCard>
  );
}

const SAMPLE_LABELS: Record<Preview["name"], string> = { short: "Short post", long: "Long post", bare: "Only the basics" };
const STEPS = [
  { title: "Get the instructions", line: "Give these to Claude, ChatGPT or your designer. They send back one HTML file." },
  { title: "Add your design", line: "Paste the HTML, or import the file." },
  { title: "Check the preview", line: "This is your design with three different posts." },
] as const;

function AddDesign({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string[] | null>(null);
  const [passed, setPassed] = useState<{ name: string; previews: Preview[]; standIns: StandIn[] } | null>(null);
  const [sample, setSample] = useState<Preview["name"]>("short");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const close = () => {
    // A half-done design stays in the box for next time; the flow starts where it can.
    setStep(html.trim() ? 1 : 0);
    setError(null);
    onClose();
  };
  const edit = (v: string) => {
    setHtml(v);
    setFailed(null);
    setPassed(null);
    setError(null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contractPrompt());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Select the text and copy it yourself.");
    }
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const read = await readDesignFile(file);
    if (!read.ok) {
      setError(read.error);
      return;
    }
    edit(read.text);
    setFileName(file.name);
  };
  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      const r = await apiClient.post<Checked>("/api/cover-templates/check", { html });
      if (r.ok) {
        setPassed({ name: r.name, previews: r.previews, standIns: r.stand_ins ?? [] });
        setSample("short");
        setStep(2);
      } else setFailed(r.errors);
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't check the design."));
    } finally {
      setChecking(false);
    }
  };
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // The same text that passed the check; the server checks it again.
      await apiClient.post("/api/cover-templates", { html });
      setHtml("");
      setFileName(null);
      setPassed(null);
      setStep(0);
      onSaved();
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't save the design."));
    } finally {
      setSaving(false);
    }
  };

  const shown = passed?.previews.find((p) => p.name === sample) ?? passed?.previews[0];
  const note = passed && sample !== "bare" ? standInNote(passed.standIns) : null;
  const icon = "h-4 w-4";

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={
        <div className="space-y-3">
          <ol className="grid w-40 grid-cols-3 gap-1.5" aria-label={`Step ${step + 1} of 3`}>
            {STEPS.map((_, i) => (
              <li key={i} className={`h-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-brand" : "bg-line"}`} />
            ))}
          </ol>
          <div className="space-y-1">
            <h3 className="text-[21px] font-semibold leading-snug tracking-tight text-ink">{STEPS[step].title}</h3>
            <p className={brandText.line}>{STEPS[step].line}</p>
          </div>
        </div>
      }
      maxWidthClass="max-w-2xl"
      variant="sheet"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-6 pt-5">
        {step === 0 && (
          <div className="space-y-3">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-2 p-4 font-sans text-sm leading-relaxed text-muted">{contractPrompt()}</pre>
            <Button variant="secondary" size="sm" onClick={copy} icon={copied ? <Check className={icon} aria-hidden="true" /> : <Copy className={icon} aria-hidden="true" />}>
              {copied ? "Copied" : "Copy the instructions"}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className={`${buttonStyles({ variant: "secondary", size: "sm" })} cursor-pointer`}>
                <Upload className={icon} aria-hidden="true" />
                Import a file
                <input
                  type="file"
                  accept=".html,.htm,.txt,text/html,text/plain"
                  className="sr-only"
                  onChange={(e) => {
                    void importFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {fileName && <span className="min-w-0 truncate text-sm text-muted">{fileName}</span>}
            </div>
            <textarea
              data-no-dictation
              value={html}
              onChange={(e) => {
                edit(e.target.value);
                setFileName(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                e.preventDefault();
                void importFile(f);
              }}
              rows={10}
              spellCheck={false}
              placeholder="Paste the HTML here, or drop the file"
              aria-label="Design HTML"
              className={`${inputClass} block resize-none font-mono text-sm leading-relaxed`}
            />
            {failed && (
              <div role="alert" className="space-y-2 rounded-2xl bg-danger/5 p-4">
                <p className="text-[15px] font-medium text-ink">This design can&apos;t be saved yet</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                  {failed.map((m) => <li key={m}>{m}</li>)}
                </ul>
                <p className={brandText.note}>Send these lines back to whoever made it, then paste the new version.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && passed && shown && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[15px] text-ink">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                {passed.name} passed every check.
              </p>
              <Segmented label="Sample post" value={sample} onChange={setSample} options={passed.previews.map((p) => ({ id: p.name, label: SAMPLE_LABELS[p.name] }))} />
            </div>
            <div className="mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-2xl border border-line bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgSrc(shown.svg)} alt={`${passed.name} with a ${SAMPLE_LABELS[shown.name].toLowerCase()}`} className="h-full w-full object-cover" />
            </div>
            {note && <p className={`${brandText.note} text-center`}>{note}</p>}
          </div>
        )}

        {error && <ErrorLine text={error} />}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line/60 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end">
        {step === 0 ? (
          <Button variant="secondary" onClick={close}>Cancel</Button>
        ) : (
          <Button variant="secondary" onClick={() => setStep(step === 2 ? 1 : 0)}>Back</Button>
        )}
        {step === 0 && <Button onClick={() => setStep(1)}>I have my design</Button>}
        {step === 1 && <Button loading={checking} disabled={!html.trim()} onClick={check}>Check my design</Button>}
        {step === 2 && <Button loading={saving} onClick={save}>Save design</Button>}
      </div>
    </Modal>
  );
}
