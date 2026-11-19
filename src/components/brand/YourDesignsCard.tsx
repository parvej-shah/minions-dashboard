"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Plus } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { contractPrompt } from "@/lib/covers/custom/contract";
import { Button } from "@/components/ui/Button";
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
type Checked = { ok: true; name: string; previews: Preview[] } | { ok: false; errors: string[] };

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

function AddDesign({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const [html, setHtml] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Checked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const edit = (v: string) => {
    setHtml(v);
    setResult(null);
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
  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      setResult(await apiClient.post<Checked>("/api/cover-templates/check", { html }));
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
      await apiClient.post("/api/cover-templates", { html });
      setHtml("");
      setResult(null);
      onSaved();
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't save the design."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a design" maxWidthClass="max-w-2xl" variant="sheet">
      <div className="space-y-5">
        <p className={brandText.line}>Ask any AI or designer to make it with our instructions, then paste the result here.</p>
        <Button variant="secondary" size="sm" onClick={copy} icon={copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}>
          {copied ? "Copied" : "Copy the instructions"}
        </Button>
        <textarea
          data-no-dictation
          value={html}
          onChange={(e) => edit(e.target.value)}
          rows={9}
          spellCheck={false}
          placeholder="Paste the design's HTML here"
          aria-label="Design HTML"
          className={`${inputClass} font-mono text-[13px]`}
        />
        {error && <ErrorLine text={error} />}
        {result && !result.ok && (
          <div role="alert" className="space-y-2 rounded-2xl bg-surface-2 p-4">
            <p className="text-[15px] font-medium text-ink">This design can&apos;t be saved yet</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {result.errors.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}
        {result?.ok && (
          <div className="space-y-3">
            <p className="text-[15px] text-ink">{result.name} follows the contract. Here it is with three different posts.</p>
            <div className="grid grid-cols-3 gap-3">
              {result.previews.map((p) => (
                <div key={p.name} className="aspect-[4/5] overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svgSrc(p.svg)} alt={`${result.name}, ${p.name} post`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3">
          {result?.ok ? (
            <Button loading={saving} onClick={save}>Save design</Button>
          ) : (
            <Button loading={checking} disabled={!html.trim()} onClick={check}>Check my design</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
