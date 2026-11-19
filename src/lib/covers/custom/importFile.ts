import { LIMITS } from "./contract";

/**
 * Reads a design file the user picked (an .html file from Claude, Canva or a
 * designer) as plain text for the paste box. The browser only reads it; the
 * server checks the text on Check and again on Save, so nothing here decides
 * what is safe.
 */
export async function readDesignFile(file: File): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (!/\.(html?|txt)$/i.test(file.name)) return { ok: false, error: "Pick an .html file." };
  if (file.size > LIMITS.sourceBytes) return { ok: false, error: `That file is ${Math.ceil(file.size / 1024)} KB. A design can be at most ${LIMITS.sourceBytes / 1024} KB.` };
  const text = (await file.text()).trim();
  if (!text) return { ok: false, error: "That file is empty." };
  return { ok: true, text };
}
