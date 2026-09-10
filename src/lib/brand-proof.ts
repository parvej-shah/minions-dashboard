export const PROOF_DIRECTIVE_PREFIX = "proof_source_";

export interface StoredBrandProof {
  claim: string;
  sourceUrl: string;
  sourceTitle?: string;
  notes?: string;
  approved: true;
}

export function serializeBrandProof(proof: Omit<StoredBrandProof, "approved">): string {
  return JSON.stringify({ ...proof, approved: true });
}

export function parseBrandProof(instruction: string): StoredBrandProof | null {
  try {
    const value = JSON.parse(instruction) as Partial<StoredBrandProof>;
    if (
      typeof value.claim !== "string" ||
      typeof value.sourceUrl !== "string" ||
      value.approved !== true
    ) {
      return null;
    }

    const url = new URL(value.sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return {
      claim: value.claim.trim(),
      sourceUrl: url.toString(),
      sourceTitle: typeof value.sourceTitle === "string" ? value.sourceTitle.trim() : "",
      notes: typeof value.notes === "string" ? value.notes.trim() : "",
      approved: true,
    };
  } catch {
    return null;
  }
}
