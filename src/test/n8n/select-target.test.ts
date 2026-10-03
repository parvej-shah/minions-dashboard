import { describe, expect, it } from "vitest";
import { runCodeNode } from "./harness";

type IdeaRow = Record<string, unknown>;

const run = async (ideas: IdeaRow[]) =>
  (await runCodeNode("02_idea_to_asset", "Select Target", {
    input: ideas,
    nodes: { "Generate run_id": [{ run_id: "test-run" }] },
  }))[0];

const idea = (overrides: IdeaRow): IdeaRow => ({
  idea_id: "IDEA-1",
  status: "REFINED",
  claimed_at: null,
  draft_asset_id: null,
  created_at: "2026-01-01T00:00:00.000Z",
  priority: "HIGH",
  ...overrides,
});

describe("automatic idea selection", () => {
  it("chooses the oldest eligible idea regardless of priority and batch rank", async () => {
    const out = await run([
      idea({ idea_id: "IDEA-NEW", created_at: "2026-03-01T00:00:00.000Z", priority: "HIGH", batch_rank: 1 }),
      idea({ idea_id: "IDEA-OLD", created_at: "2026-01-01T00:00:00.000Z", priority: "LOW", batch_rank: 99 }),
    ]);

    expect(out).toMatchObject({ found: true, idea_id: "IDEA-OLD", orig_status: "REFINED" });
  });

  it("waits for a future scheduled idea and drafts the oldest currently available one", async () => {
    const out = await run([
      idea({ idea_id: "IDEA-SCHEDULED", status: "QUEUED", scheduled_for: "2999-01-01T00:00:00.000Z", created_at: "2025-01-01T00:00:00.000Z" }),
      idea({ idea_id: "IDEA-AVAILABLE", created_at: "2026-02-01T00:00:00.000Z" }),
    ]);

    expect(out).toMatchObject({ found: true, idea_id: "IDEA-AVAILABLE" });
  });
});
