import type { ReactElement } from "react";
import { CoverFitError, type CoverSpec } from "../layouts";
import { templateElement, type TemplateValues } from "./element";

/** What a post gives a design: the slots of the contract, read from the cover spec. Empty ones are left out. */
export function valuesFromSpec(spec: CoverSpec): TemplateValues {
  const v: TemplateValues = {
    headline: spec.headline,
    author_name: spec.author.name,
    emphasis: spec.emphasis,
    label: spec.label,
    kicker: spec.kicker,
    quote: spec.quote,
    number_value: spec.number?.value,
    number_unit: spec.number?.unit,
    author_role: spec.author.role,
    photo: spec.author.photo,
    cutout: spec.cutout?.src,
  };
  (spec.list ?? []).slice(0, 4).forEach((item, i) => {
    v[`list_${i + 1}` as "list_1"] = item;
  });
  return Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string" && x.trim())) as TemplateValues;
}

/** The CUSTOM layout. Throws CoverFitError when the design is missing or the copy cannot fit, so callers fall back to a built-in. */
export function customElement(spec: CoverSpec): ReactElement {
  const template = spec.custom?.template;
  if (!template) throw new CoverFitError("This post's custom design is not available.");
  return templateElement(template, valuesFromSpec(spec), spec.brand) as ReactElement;
}
