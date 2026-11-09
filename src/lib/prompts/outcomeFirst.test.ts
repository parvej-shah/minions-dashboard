import { describe, expect, it } from "vitest";
import { renderStrategist } from "./strategist";
import { renderWriter } from "./writer";
import { renderVariants } from "./variants";
import { draftAuthor, legacyDraftAuthor } from "@/test/n8n/fixtures";
import type { DraftAuthorContext } from "@/lib/drafts/authorContext";
import type { ChatPayload } from "./types";

const text = (p: ChatPayload) => p.messages.map((m) => String(m.content)).join("\n");

const withBuyer = (buyer: "OUTCOME" | "TECHNICAL"): DraftAuthorContext => ({ ...draftAuthor, icp: { ...draftAuthor.icp, buyer } });

const strategist = (author: DraftAuthorContext) =>
  text(renderStrategist({ brand_name: "Acme", brand_context: "", writer_standing: "", target: { audience: "ICP", pillar: "What Went Wrong", raw_idea: "x" }, author } as never));

const writer = (author: DraftAuthorContext) =>
  text(renderWriter({ company_name: "Acme", strategy: { content_mode: "INSIGHT" }, evidence_block: "None", brand_context: "", tone_examples: [], tone_questionnaire: null, author }));

describe("outcome-first drafting for readers who buy the outcome", () => {
  it("strategist and writer lead with the outcome when the ICP buys the outcome", () => {
    for (const out of [strategist(withBuyer("OUTCOME")), writer(withBuyer("OUTCOME"))]) {
      expect(out).toContain("OUTCOME FIRST");
      expect(out).toMatch(/one sentence/i);
    }
    expect(strategist(withBuyer("OUTCOME"))).toContain("name the consequence the reader feels");
  });

  it("keeps technical depth for a technical buyer", () => {
    expect(strategist(withBuyer("TECHNICAL"))).not.toContain("OUTCOME FIRST");
    expect(writer(withBuyer("TECHNICAL"))).not.toContain("OUTCOME FIRST");
  });

  it("an ICP saved before the switch (no buyer) is treated as an outcome buyer", () => {
    const icp = { ...draftAuthor.icp };
    delete icp.buyer;
    expect(writer({ ...draftAuthor, icp })).toContain("OUTCOME FIRST");
  });

  it("an idea with no author context renders as before", () => {
    expect(writer({ ...legacyDraftAuthor("How It Works"), found: false })).not.toContain("OUTCOME FIRST");
  });

  it("variants ask what each point changes for the reader, not for technical nuance", () => {
    const out = text(renderVariants({ company_name: "Acme", hook: "h", edited_body: "b", brand_context: "", tone_questionnaire: null, tone_examples: [], audience: "ICP", title: "t" } as never));
    expect(out).not.toContain("technical nuance");
    expect(out).toContain("what it changes for the reader");
  });
});
