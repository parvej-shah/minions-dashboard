/**
 * Hands a carousel's pages to the person so they can post them on Instagram.
 * On a phone, the share sheet (it can save to Photos or open Instagram); elsewhere,
 * one download per page, in order. Pages come from our own origin (see the page route).
 */
export type SavePagesResult = "shared" | "downloaded" | "cancelled";

const pageUrl = (assetId: string, n: number) => `/api/assets/${encodeURIComponent(assetId)}/carousel/page/${n}`;

export async function savePages(assetId: string, count: number): Promise<SavePagesResult> {
  const files: File[] = [];
  for (let n = 1; n <= count; n++) {
    const res = await fetch(pageUrl(assetId, n));
    if (!res.ok) throw new Error(`Page ${n} could not be loaded.`);
    files.push(new File([await res.blob()], `page-${String(n).padStart(2, "0")}.jpg`, { type: "image/jpeg" }));
  }
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  for (const file of files) {
    const href = URL.createObjectURL(file);
    const a = Object.assign(document.createElement("a"), { href, download: file.name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    // Browsers ask once to allow several downloads; a short gap keeps them from being dropped.
    await new Promise((r) => setTimeout(r, 250));
  }
  return "downloaded";
}
