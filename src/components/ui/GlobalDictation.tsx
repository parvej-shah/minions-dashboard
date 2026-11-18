"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDictation } from "@/hooks/useDictation";
import { isDictatable, micPlacement } from "@/lib/dictation";
import DictationMic from "./DictationMic";

type Field = HTMLInputElement | HTMLTextAreaElement;
type Spot = { field: Field; top: number; left: number; size: number };

function asDictatable(el: EventTarget | null): Field | null {
  if (!(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) return null;
  const ok = isDictatable({
    tag: el.tagName,
    type: el instanceof HTMLInputElement ? el.getAttribute("type") ?? "" : "",
    readOnly: el.readOnly,
    disabled: el.disabled,
    optedOut: el.closest("[data-no-dictation]") !== null,
  });
  return ok && el.getBoundingClientRect().width >= 120 ? el : null;
}

/** Sets a React-controlled field's value the way typing would, so its onChange runs. */
function writeField(el: Field, next: string) {
  const text = el.maxLength > 0 ? next.slice(0, el.maxLength) : next;
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * One mic for every free-text field without its own: it appears inside
 * whichever box has focus, and talking types into that box.
 */
export default function GlobalDictation() {
  const [field, setField] = useState<Field | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const fieldRef = useRef<Field | null>(null);
  const { supported, listening, error, stop, toggle } = useDictation(
    () => fieldRef.current?.value ?? "",
    (next) => fieldRef.current && writeField(fieldRef.current, next),
  );
  const listeningRef = useRef(listening);
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });
  useEffect(() => {
    listeningRef.current = listening;
    // Once talking ends in a box that no longer has focus, the mic goes away.
    if (!listening && fieldRef.current && document.activeElement !== fieldRef.current) setField(null);
  }, [listening]);

  // Follow focus.
  useEffect(() => {
    if (!supported) return;
    const onIn = (e: FocusEvent) => {
      const next = asDictatable(e.target);
      if (next !== fieldRef.current && listeningRef.current) stopRef.current();
      setField(next);
    };
    const onOut = (e: FocusEvent) => {
      if (listeningRef.current) return;
      if (e.target === fieldRef.current && !asDictatable(e.relatedTarget)) setField(null);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, [supported]);

  // Make room for the mic and keep it on the box while things scroll or resize.
  useEffect(() => {
    fieldRef.current = field;
    if (!field) return;
    const multiline = field instanceof HTMLTextAreaElement;
    const prevPadding = field.style.paddingRight;
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!field.isConnected) {
          stopRef.current();
          setField(null);
          return;
        }
        const r = field.getBoundingClientRect();
        const s = micPlacement(r, multiline);
        setSpot({ field, ...s });
        const need = s.size + (multiline ? 12 : 8);
        if (parseFloat(getComputedStyle(field).paddingRight) < need) field.style.paddingRight = `${need}px`;
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(field);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      field.style.paddingRight = prevPadding;
    };
  }, [field]);

  if (!supported || !field || spot?.field !== field) return null;

  return createPortal(
    <div className="fixed z-[110] animate-pop-in" style={{ top: spot.top, left: spot.left }}>
      <DictationMic listening={listening} onToggle={toggle} size={spot.size} keepFocus />
      {error && (
        <span role="status" className="absolute right-0 top-full mt-1 whitespace-nowrap rounded-lg bg-surface px-2 py-1 text-xs text-coral shadow-soft">
          {error}
        </span>
      )}
    </div>,
    document.body,
  );
}
