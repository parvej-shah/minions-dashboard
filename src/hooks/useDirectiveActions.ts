import type { Dispatch, SetStateAction } from "react";
import { createDirective, deleteDirectiveRequest } from "@/lib/directivesClient";
import type { BrandCategory, BrandDirectiveItem } from "@/types";

const KEY_WORDS = 4;

/** A rule key made from the first words of the rule's text. */
const keyFromText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, KEY_WORDS)
    .join("_") || "directive_rule";

/** Add and remove for a list of brand rules held in the parent's state. */
export function useDirectiveActions(directives: BrandDirectiveItem[], setDirectives: Dispatch<SetStateAction<BrandDirectiveItem[]>>) {
  const add = async (category: BrandCategory, text: string) => {
    const content = text.trim();
    if (!content) return;
    const created = await createDirective({ category, key: keyFromText(content), content });
    setDirectives((prev) => [created, ...prev]);
  };

  /** Removes the rule at once and puts it back if the server refuses. */
  const remove = async (id: string) => {
    const previous = directives;
    setDirectives(directives.filter((directive) => directive.id !== id));
    try {
      await deleteDirectiveRequest(id);
    } catch {
      setDirectives(previous);
    }
  };

  return { add, remove };
}
