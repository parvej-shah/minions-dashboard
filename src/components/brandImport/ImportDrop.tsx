"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, FileUp, Globe, Loader2, X } from "lucide-react";
import { PdfReadError, readPdfText } from "@/lib/brandImport/readPdf";

export interface DroppedProfile {
  fileName: string;
  text: string;
}

/**
 * The two things an import reads: the LinkedIn PDF (read here in the browser)
 * and the website. Either one is enough to start.
 */
export function ImportDrop({
  profile,
  onProfile,
  websiteUrl,
  onWebsiteUrl,
}: {
  profile: DroppedProfile | null;
  onProfile: (profile: DroppedProfile | null) => void;
  websiteUrl: string;
  onWebsiteUrl: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      onProfile({ fileName: file.name, text: await readPdfText(file) });
    } catch (err) {
      setError(err instanceof PdfReadError ? err.message : "Couldn't read that PDF. Try downloading it again.");
    } finally {
      setReading(false);
    }
  }

  const words = profile ? profile.text.split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      {profile ? (
        <div className="animate-pop-in flex items-center gap-3 rounded-2xl border border-brand bg-brand/10 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
            <Check className="h-6 w-6" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{profile.fileName}</span>
            <span className="block text-sm text-muted">{words.toLocaleString()} words ready to read</span>
          </span>
          <button
            type="button"
            onClick={() => onProfile(null)}
            aria-label="Remove this PDF"
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void take(e.dataTransfer.files[0]);
          }}
          className={`group flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
            dragging ? "border-brand bg-brand/10" : "border-line-strong bg-surface hover:border-brand/60 hover:bg-surface-2"
          }`}
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:-translate-y-0.5 ${
              dragging ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface-2 text-brand"
            }`}
          >
            {reading ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileUp className="h-8 w-8" strokeWidth={2.25} />}
          </span>
          <span className="text-lg font-semibold text-ink">{reading ? "Opening your PDF…" : "Drop your LinkedIn PDF here"}</span>
          <span className="text-sm text-muted">or tap to choose it. A résumé works too. It stays on your device; only the text is read.</span>
        </button>
      )}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void take(e.target.files?.[0])} />
      {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}

      <details className="group rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-ink">
          How do I get my LinkedIn PDF?
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Open your profile on linkedin.com (on a computer).</li>
          <li>
            Click <b className="text-ink">Resources</b> (or <b className="text-ink">More</b>) under your name.
          </li>
          <li>
            Choose <b className="text-ink">Save to PDF</b>, then drop the file here.
          </li>
        </ol>
      </details>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors focus-within:border-brand">
        <Globe className="h-5 w-5 shrink-0 text-subtle" />
        <input
          type="url"
          inputMode="url"
          value={websiteUrl}
          onChange={(e) => onWebsiteUrl(e.target.value)}
          placeholder="yourcompany.com (optional, but it helps a lot)"
          aria-label="Your website"
          className="w-full bg-transparent text-base text-ink placeholder:text-subtle focus:outline-none sm:text-lg"
        />
      </label>
    </div>
  );
}
