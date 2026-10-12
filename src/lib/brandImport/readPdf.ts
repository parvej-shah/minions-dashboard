/**
 * Reads a LinkedIn "Save to PDF" export or a résumé in the browser and returns
 * its text. The file never leaves the device; only the text is sent to the
 * import. Lines are rebuilt from pdf.js's end-of-line markers, so the import's
 * quote checks see the same sentences the author does.
 */

const MAX_PAGES = 12;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export class PdfReadError extends Error {}

export async function readPdfText(file: File): Promise<string> {
  if (file.type && file.type !== "application/pdf") throw new PdfReadError("That isn't a PDF. On LinkedIn: your profile › More › Save to PDF.");
  if (file.size > MAX_FILE_BYTES) throw new PdfReadError("That PDF is over 15 MB. A LinkedIn export is usually under 1 MB.");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch {
    void task.destroy();
    throw new PdfReadError("Couldn't open that PDF. Try downloading it again.");
  }

  try {
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PAGES); i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      let page = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        page += item.str + (item.hasEOL ? "\n" : "");
      }
      pages.push(page);
    }
    const text = pages
      .join("\n")
      // LinkedIn's footer on every page.
      .replace(/^Page \d+ of \d+$/gm, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length < 80) throw new PdfReadError("That PDF has no readable text. It may be a scan; try LinkedIn's Save to PDF instead.");
    return text;
  } finally {
    void task.destroy();
  }
}
