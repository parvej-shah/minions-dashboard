/**
 * Free voice dictation: the browser's own speech recognition (Web Speech API).
 * No server, no key, no cost. Chrome, Edge and Safari have it; Firefox does
 * not, so the mic is simply not shown there.
 */

/** The slice of SpeechRecognition the app uses. */
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface RecognitionResultEvent {
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

export type RecognitionCtor = new () => Recognition;

export function getRecognitionCtor(win: unknown): RecognitionCtor | null {
  if (!win || typeof win !== "object") return null;
  const w = win as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as RecognitionCtor) : null;
}

export function dictationLanguage(browserLang: string | undefined): string {
  return browserLang?.trim() || "en-US";
}

/** Adds spoken text after what is already typed, with one space between. */
export function joinDictation(base: string, spoken: string): string {
  const said = spoken.trim().replace(/\s+/g, " ");
  if (!said) return base;
  if (!base) return said;
  if (/\s$/.test(base)) return /\n$/.test(base) ? base + said : base.replace(/[ \t]+$/, " ") + said;
  return `${base} ${said}`;
}

/** The whole session's text so far, final and still-being-heard parts together. */
export function transcriptOf(e: RecognitionResultEvent): string {
  let text = "";
  for (let i = 0; i < e.results.length; i++) text += `${e.results[i][0].transcript} `;
  return text;
}

/** Plain copy for a recognition error; null when there is nothing to say. */
export function dictationErrorMessage(code: string): string | null {
  switch (code) {
    case "aborted":
    case "no-speech":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Allow the microphone for this site to talk instead of type.";
    case "audio-capture":
      return "No microphone found.";
    case "network":
      return "Voice needs an internet connection. Try again.";
    default:
      return "Couldn't hear that. Try again.";
  }
}

const PROSE_INPUT_TYPES = new Set(["", "text", "search"]);

/** Whether a field is free text someone might rather say than type. */
export function isDictatable(f: { tag: string; type: string; readOnly: boolean; disabled: boolean; optedOut: boolean }): boolean {
  if (f.readOnly || f.disabled || f.optedOut) return false;
  if (f.tag === "TEXTAREA") return true;
  return f.tag === "INPUT" && PROSE_INPUT_TYPES.has(f.type.toLowerCase());
}

/** Where the shared mic sits inside a field: bottom-right of a text box, middle-right of an input. */
export function micPlacement(
  rect: { top: number; left: number; width: number; height: number },
  multiline: boolean,
): { top: number; left: number; size: number } {
  const inset = multiline ? 8 : 4;
  const size = multiline ? 36 : Math.max(22, Math.min(36, rect.height - 8));
  return {
    size,
    left: rect.left + rect.width - size - inset,
    top: multiline ? rect.top + rect.height - size - inset : rect.top + (rect.height - size) / 2,
  };
}
