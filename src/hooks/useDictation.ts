"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  dictationErrorMessage,
  dictationLanguage,
  getRecognitionCtor,
  insertDictation,
  transcriptOf,
  type DictationRange,
  type Recognition,
} from "@/lib/dictation";

const noop = () => () => {};

/**
 * Talk into a text box. While listening, the box shows what has been heard so
 * far inserted at the caret/selection (or appended if no selection was captured).
 */
export function useDictation(
  value: string | (() => string),
  onChange: (next: string, cursorPosition?: number) => void,
  getSelection?: () => DictationRange | null,
) {
  const supported = useSyncExternalStore(
    noop,
    () => getRecognitionCtor(window) !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onChangeRef = useRef(onChange);
  const getSelectionRef = useRef(getSelection);
  useEffect(() => {
    onChangeRef.current = onChange;
    getSelectionRef.current = getSelection;
  });

  useEffect(() => () => recRef.current?.abort(), []);

  const stop = () => recRef.current?.stop();

  const start = () => {
    const Ctor = getRecognitionCtor(window);
    if (!Ctor || recRef.current) return;
    const base = typeof value === "function" ? value() : value;
    const sel = getSelectionRef.current?.();
    const anchorRange =
      sel != null
        ? {
            start: Math.max(0, Math.min(sel.start, base.length)),
            end: Math.max(0, Math.min(sel.end, base.length)),
          }
        : { start: base.length, end: base.length };

    const rec = new Ctor();
    rec.lang = dictationLanguage(navigator.language);
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const { text, cursor } = insertDictation(base, transcriptOf(e), anchorRange);
      onChangeRef.current(text, cursor);
    };
    rec.onerror = (e) => setError(dictationErrorMessage(e.error));
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    setError(null);
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setError(dictationErrorMessage("start"));
    }
  };

  return { supported, listening, error, stop, toggle: listening ? stop : start };
}
