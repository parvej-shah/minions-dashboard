/** "just now" / "12m ago" / "3h ago" / "Aug 14" */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString).getTime();
  if (Number.isNaN(date)) return "—";

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date) / 1000));

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;

  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Aug 14, 2026" */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "14:05" in the viewer's locale. */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "Aug 14, 2026, 02:05 PM" */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
