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
