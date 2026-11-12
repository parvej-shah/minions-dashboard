import { describe, expect, it } from "vitest";
import { ideasFor, distillIdea, createQuickIdeaPayload } from "@/lib/ideas/list";
import type { IdeaItem } from "@/types";

const idea = (id: string, status: string, extra: Partial<IdeaItem> = {}): IdeaItem =>
  ({
    id,
    ideaId: id,
    title: id,
    raw_idea: id,
    excerpt: "",
    angle: "",
    status,
    source: "MANUAL",
    created_at: "2026-11-01T00:00:00Z",
    draftAssetId: null,
    tags: [],
    ...extra,
  }) as unknown as IdeaItem;

describe("ideasFor priority / Make next", () => {
  it("promotes an idea with priority HIGH to the top of Up next", () => {
    const ideas = [
      idea("idea-1", "REFINED", { created_at: "2026-11-01T00:00:00Z" }),
      idea("idea-2", "REFINED", { created_at: "2026-11-02T00:00:00Z" }),
      idea("idea-3", "REFINED", { created_at: "2026-11-03T00:00:00Z", priority: "HIGH" }),
    ];
    const plan = [{ idea_id: "idea-1", slot_at: "2026-11-10T15:00:00Z" }];

    const list = ideasFor(ideas, "next", plan, "");
    // The prioritized idea should be first in the queue
    expect(list[0].idea.id).toBe("idea-3");
    expect(list.map((x) => x.idea.id)).toEqual(["idea-3", "idea-1", "idea-2"]);
  });
});

describe("distillIdea", () => {
  it("splits a long multi-sentence raw idea into a punchy hook and supporting note", () => {
    const longRaw =
      "A brokerage was losing 30% of scheduled viewings to no-shows, costing agents 60 to 90 minutes of wasted travel per ghosted appointment. The fix was eliminating the silent gap between the phone booking and viewing day by having the voice agent instantly lock the slot into the CRM calendar and fire an SMS confirmation with the listing link.";
    const result = distillIdea(longRaw, "");
    expect(result.hook).toBe(
      "A brokerage was losing 30% of scheduled viewings to no-shows, costing agents 60 to 90 minutes of wasted travel per ghosted appointment."
    );
    expect(result.detail).toBe(
      "The fix was eliminating the silent gap between the phone booking and viewing day by having the voice agent instantly lock the slot into the CRM calendar and fire an SMS confirmation with the listing link."
    );
  });

  it("handles short titles cleanly without inventing details", () => {
    const result = distillIdea("Sub-1.2 second response latency is mandatory", "Extra context");
    expect(result.hook).toBe("Sub-1.2 second response latency is mandatory");
    expect(result.detail).toBe("Extra context");
  });
});

describe("createQuickIdeaPayload", () => {
  it("extracts URL when pasted directly into the input", () => {
    const input = "https://techcrunch.com/2026/11/ai-agents AI voice agents for inbound brokerage calls";
    const payload = createQuickIdeaPayload(input);
    expect(payload.source_url).toBe("https://techcrunch.com/2026/11/ai-agents");
    expect(payload.title).toContain("AI voice agents for inbound brokerage calls");
    expect(payload.source).toBe("MANUAL_REFERENCE");
  });

  it("creates a clean idea from a single sentence without extra questions", () => {
    const input = "Why after-hours callbacks lose 80% of buyers to whoever answers first";
    const payload = createQuickIdeaPayload(input);
    expect(payload.title).toBe(input);
    expect(payload.source_url).toBeNull();
    expect(payload.source).toBe("MANUAL");
  });
});
