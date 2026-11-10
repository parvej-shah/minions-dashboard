"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Loader2, X } from "lucide-react";
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
    <div>
      {profile ? (
        <div className="animate-pop-in flex items-center gap-4 rounded-[28px] bg-surface p-5 shadow-soft sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-medium text-ink">{profile.fileName}</span>
            <span className="block text-[15px] text-muted">{words.toLocaleString()} words, ready to read</span>
          </span>
          <button
            type="button"
            onClick={() => onProfile(null)}
            aria-label="Remove this PDF"
            className="rounded-full p-2 text-subtle transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
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
          className={`flex w-full flex-col items-center gap-2.5 rounded-[28px] px-6 py-10 text-center shadow-soft transition-colors cursor-pointer sm:py-12 ${
            dragging ? "bg-brand/5 ring-2 ring-brand" : "bg-surface hover:bg-surface-2"
          }`}
        >
          {reading ? <Loader2 className="h-9 w-9 animate-spin text-brand" aria-hidden="true" /> : <FileUp className="h-9 w-9 text-brand" strokeWidth={1.6} aria-hidden="true" />}
          <span className="text-[19px] font-semibold text-ink">{reading ? "Opening your PDF…" : "Drop your LinkedIn PDF"}</span>
          <span className="text-[15px] text-muted">or click to choose it. A résumé works too.</span>
        </button>
      )}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void take(e.target.files?.[0])} />
      {error && (
        <p role="alert" className="mt-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      <details className="group mt-3 text-[15px]">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-brand underline-offset-4 hover:underline">How do I get my LinkedIn PDF?</summary>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted">
          <li>Open your profile on linkedin.com, on a computer.</li>
          <li>Click Resources (or More) under your name.</li>
          <li>Choose Save to PDF, then drop the file above.</li>
        </ol>
      </details>

      <label htmlFor="import-website" className="mt-7 block text-[15px] font-medium text-ink">
        Your website <span className="font-normal text-subtle">(optional, helps a lot)</span>
      </label>
      <input
        id="import-website"
        type="url"
        inputMode="url"
        value={websiteUrl}
        onChange={(e) => onWebsiteUrl(e.target.value)}
        placeholder="yourcompany.com"
        className="mt-2 w-full rounded-[14px] border border-line-strong bg-surface px-4 py-3.5 text-[17px] text-ink placeholder:text-subtle transition-colors focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
      />
    </div>
  );
}
