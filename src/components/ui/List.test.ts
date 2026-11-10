import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChoiceRow, GroupedList, ListRow, Switch } from "./List";

describe("List kit", () => {
  it("Switch is an accessible switch", () => {
    const on = renderToStaticMarkup(h(Switch, { checked: true, onChange: () => {}, label: "LinkedIn" }));
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('aria-label="LinkedIn"');
    const off = renderToStaticMarkup(h(Switch, { checked: false, onChange: () => {}, label: "Blog" }));
    expect(off).toContain('aria-checked="false"');
  });

  it("ChoiceRow marks only the chosen one", () => {
    const chosen = renderToStaticMarkup(h(ChoiceRow, { label: "Headline", selected: true, onSelect: () => {} }));
    const other = renderToStaticMarkup(h(ChoiceRow, { label: "List", hint: "Not available: no points", selected: false, disabled: true, onSelect: () => {} }));
    expect(chosen).toContain('aria-checked="true"');
    expect(other).toContain('aria-checked="false"');
    expect(other).toContain("disabled");
    expect(other).toContain("Not available: no points");
  });

  it("GroupedList renders header, rows and footer", () => {
    const html = renderToStaticMarkup(
      h(GroupedList, { header: "Post to", footer: "Only this post.", children: h(ListRow, { label: "Blog", trailing: "x" }) })
    );
    expect(html).toContain("Post to");
    expect(html).toContain("Blog");
    expect(html).toContain("Only this post.");
  });
});
