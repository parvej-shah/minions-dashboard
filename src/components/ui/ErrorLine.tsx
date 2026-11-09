import { AlertTriangle } from "lucide-react";

/** An inline error under a form or in place of content that failed to load. */
export default function ErrorLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
