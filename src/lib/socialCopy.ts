/**
 * Small rules for the text that goes under a Facebook or Instagram image
 * (task 34). The image leads; the words stay out of its way.
 */

/** The one plain line n8n 03 comments under a Facebook post. Keep its wording in step with Comment_Blog_Link_on_FB. */
export function linkComment(url: string): string {
  return `Read the full article: ${url}`;
}

/**
 * What an Instagram caption gets wrong, as warnings (never a block: it is
 * posted by hand). n8n 02's Validate Social Variants carries a copy; keep in sync.
 */
export function instagramIssues(caption: string): string[] {
  const URL_PATTERN = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ai|io|co|net|org)\b/i;
  const text = (caption || "").trim();
  if (!text) return ["Instagram caption is empty."];
  const issues: string[] = [];
  if (URL_PATTERN.test(text)) issues.push("Instagram caption has a link; links in captions do not click.");
  const tags = (text.match(/#\w+/g) || []).length;
  if (tags < 3 || tags > 5) issues.push(`Instagram caption has ${tags} hashtags; use 3 to 5.`);
  const words = text.split(/\s+/).filter((w) => !w.startsWith("#")).length;
  if (words > 60) issues.push(`Instagram caption is ${words} words; keep it under 60.`);
  if (text.split("\n")[0].trim().length > 125) issues.push("Instagram caption's first line runs past the 125 characters shown before \"more\".");
  return issues;
}
