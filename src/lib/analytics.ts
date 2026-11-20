/**
 * Google Analytics 4 events. Page views come from the GA tag itself; these are
 * the few actions worth counting. Events carry no personal data: no email, name,
 * post text or ids. Without the tag (local dev, ad blockers) every call is a no-op.
 */
type AnalyticsEvent = "post_approved" | "app_installed";

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

export function track(name: AnalyticsEvent, params?: Record<string, string>): void {
  try {
    if (typeof window === "undefined") return;
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.("event", name, params);
  } catch {
    // Analytics must never break the app.
  }
}
