/**
 * Markdown normalisation and block classification for editorial article bodies,
 * shared by the split and reading views.
 */

export type MarkdownBlock =
  | { kind: "image"; src: string; alt: string }
  | { kind: "rule"; header: string; body: string }
  | { kind: "heading"; level: 2 | 3; title: string; trailing: string }
  | { kind: "code"; lang: string; code: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "paragraph"; text: string };

const MARKDOWN_IMAGE = /!\[(.*?)\]\((https?:\/\/[^)\s]+)\)/;
const BARE_IMAGE_URL = /^\(?(https?:\/\/[^\s)]+\.(png|jpe?g|webp|svg|gif)(\?[^\s)]*)?)\)?$/i;
const POLLINATIONS_URL = /^\(?(https?:\/\/image\.pollinations\.ai\/[^\s)]+)\)?$/i;
const RULE_PREFIX = /^Rule\s+\d+:/i;

/**
 * Forces blank lines around block-level constructs so a body written as one
 * run-on string still splits into paragraphs.
 */
function normalizeMarkdown(body: string): string {
  return (body || "")
    .replace(/^(\s*#{1,6}\s+[^\n]+)/gm, "\n\n$1\n\n")
    .replace(/!\[([^\]]*)\]\s*\((https?:\/\/[^)\s]+)\)/g, "\n\n![$1]($2)\n\n")
    .replace(/(```[\s\S]*?```)/g, "\n\n$1\n\n")
    .replace(/^(\s*>[^\n]+)/gm, "\n\n$1\n\n")
    .replace(/(?:^|\n|\s+)(Rule\s+\d+:)/gi, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n");
}

/** Classifies one already-trimmed chunk into a renderable block. */
function classify(trimmed: string): MarkdownBlock {
  const imageMatch = trimmed.match(MARKDOWN_IMAGE);
  if (imageMatch) {
    return { kind: "image", alt: imageMatch[1] || "Editorial Image", src: imageMatch[2] };
  }

  if (BARE_IMAGE_URL.test(trimmed) || POLLINATIONS_URL.test(trimmed)) {
    return {
      kind: "image",
      alt: "Editorial Graphic",
      src: trimmed.replace(/^\(|\)$/g, "").trim(),
    };
  }

  if (RULE_PREFIX.test(trimmed)) {
    const ruleMatch = trimmed.match(/^(Rule\s+\d+:)\s*([\s\S]*)$/i);
    return {
      kind: "rule",
      header: ruleMatch ? ruleMatch[1] : "Rule",
      body: ruleMatch ? ruleMatch[2] : trimmed,
    };
  }

  if (/^#{1,6}\s+/.test(trimmed)) {
    const lines = trimmed.split("\n");
    const firstLine = lines[0].trim();
    return {
      kind: "heading",
      level: firstLine.startsWith("###") ? 3 : 2,
      title: firstLine.replace(/^#{1,6}\s+/, "").trim(),
      trailing: lines.slice(1).join("\n").trim(),
    };
  }

  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const closesFence = lines[lines.length - 1].startsWith("```");
    return {
      kind: "code",
      lang: lines[0].replace("```", "").trim() || "json",
      code: lines.slice(1, closesFence ? -1 : undefined).join("\n"),
    };
  }

  if (trimmed.startsWith("1. ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    return {
      kind: "list",
      items: trimmed.split("\n").map((item) => item.replace(/^(\d+\.|\*|-)\s+/, "")),
    };
  }

  if (trimmed.startsWith("> ")) {
    return { kind: "quote", text: trimmed.replace(/^>\s*/, "") };
  }

  return { kind: "paragraph", text: trimmed };
}

/** Normalises a body and returns its renderable blocks in order. */
export function parseMarkdownBlocks(body: string): MarkdownBlock[] {
  return normalizeMarkdown(body)
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(classify);
}
