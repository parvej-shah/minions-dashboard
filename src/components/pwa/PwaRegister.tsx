"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function PwaRegister() {
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let reloading = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const showWaitingWorker = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) {
        setUpdateWaiting(registration.waiting);
      }
    };

    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };

    const onUpdateFound = () => {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") showWaitingWorker();
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((nextRegistration) => {
        registration = nextRegistration;
        showWaitingWorker();
        registration.addEventListener("updatefound", onUpdateFound);
      })
      .catch((error) => {
        console.warn("[PWA] Service worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  if (!updateWaiting) return null;

  return (
    <aside
      aria-label="App update"
      className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-float"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">An update is ready</p>
        <p className="text-xs text-muted">Refresh to get the latest improvements.</p>
      </div>
      <button
        type="button"
        onClick={() => updateWaiting.postMessage({ type: "SKIP_WAITING" })}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Refresh
      </button>
      <button
        type="button"
        aria-label="Dismiss update notice"
        onClick={() => setUpdateWaiting(null)}
        className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
