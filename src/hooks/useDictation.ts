"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  dictationErrorMessage,
  dictationLanguage,
  getRecognitionCtor,
  joinDictation,
  transcriptOf,
  type Recognition,
} from "@/lib/dictation";

const noop = () => () => {};

/**
 * Talk into a text box. While listening, the box shows what has been heard so
 * far after whatever was typed before the mic was tapped.
 */
export function useDictation(value: string, onChange: (next: string) => void) {
  const supported = useSyncExternalStore(
    noop,
    () => getRecognitionCtor(window) !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => () => recRef.current?.abort(), []);

  const stop = () => recRef.current?.stop();

  const start = () => {
    const Ctor = getRecognitionCtor(window);
    if (!Ctor || recRef.current) return;
    const base = value;
    const rec = new Ctor();
    rec.lang = dictationLanguage(navigator.language);
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => onChangeRef.current(joinDictation(base, transcriptOf(e)));
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

  return { supported, listening, error, toggle: listening ? stop : start };
}
