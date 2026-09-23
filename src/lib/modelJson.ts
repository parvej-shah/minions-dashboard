/**
 * Parses a model's JSON reply. Models regularly put raw line breaks or tabs
 * inside JSON strings (seen from the editor on real drafts), which JSON.parse
 * rejects; this escapes them and tries again. The n8n parse nodes in 02
 * carry the same function (a contract test keeps them identical).
 */
export function parseModelJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    let out = "";
    let inString = false;
    let escaped = false;
    for (const ch of cleaned) {
      if (!inString) {
        if (ch === '"') inString = true;
        out += ch;
      } else if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") out += "\\n";
      else if (ch === "\t") out += "\\t";
      else if (ch !== "\r") out += ch;
    }
    return JSON.parse(out);
  }
}
