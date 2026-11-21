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

export interface DictationRange {
  start: number;
  end: number;
}

export interface DictationInsertionResult {
  text: string;
  cursor: number;
}

/**
 * Inserts or replaces spoken text at a specific character range (e.g. caret or selection).
 * Manages surrounding whitespace and punctuation to prevent character collisions.
 */
export function insertDictation(
  base: string,
  spoken: string,
  range?: DictationRange,
): DictationInsertionResult {
  const said = spoken.trim().replace(/\s+/g, " ");
  const rawStart = range?.start ?? base.length;
  const rawEnd = range?.end ?? base.length;
  const start = Math.max(0, Math.min(rawStart, base.length));
  const end = Math.max(start, Math.min(rawEnd, base.length));

  if (!said) {
    return { text: base, cursor: start };
  }

  const prefix = base.slice(0, start);
  const suffix = base.slice(end);

  const needsLeadingSpace = prefix.length > 0 && !/\s$/.test(prefix);
  const startsWithPunctuation = /^[.,!?;:)\]}]/.test(suffix);
  const needsTrailingSpace = suffix.length > 0 && !/^\s/.test(suffix) && !startsWithPunctuation;

  const insertText = `${needsLeadingSpace ? " " : ""}${said}${needsTrailingSpace ? " " : ""}`;
  const text = `${prefix}${insertText}${suffix}`;
  const cursor = prefix.length + (needsLeadingSpace ? 1 : 0) + said.length;

  return { text, cursor };
}

/** Adds spoken text after what is already typed, with one space between. */
export function joinDictation(base: string, spoken: string): string {
  return insertDictation(base, spoken, { start: base.length, end: base.length }).text;
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

/** Where the shared mic sits inside a field: top-right of a text box (sticky when scrolled), middle-right of an input. */
export function micPlacement(
  rect: { top: number; left: number; width: number; height: number },
  multiline: boolean,
  viewportTopOffset = 72,
): { top: number; left: number; size: number } {
  const inset = multiline ? 8 : 4;
  const size = multiline ? 36 : Math.max(22, Math.min(36, rect.height - 8));
  let top = multiline ? rect.top + inset : rect.top + (rect.height - size) / 2;
  if (multiline) {
    const bottom = rect.top + rect.height;
    const minTop = Math.max(rect.top + inset, viewportTopOffset);
    const maxTop = bottom - size - inset;
    top = Math.max(rect.top + inset, Math.min(minTop, maxTop));
  }
  return {
    size,
    left: rect.left + rect.width - size - inset,
    top,
  };
}
