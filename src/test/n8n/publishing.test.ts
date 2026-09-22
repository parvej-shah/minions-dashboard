import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { runCodeNode, workflowNodes } from "./harness";

type Connections = Record<string, { main?: ({ node: string }[] | null)[] }>;

function connections(slug: string): Connections {
  return JSON.parse(fs.readFileSync(path.resolve("n8n/workflows", slug, "workflow.json"), "utf8")).connections;
}

describe("03_review_publisher never posts an asset twice", () => {
  const slug = "03_review_publisher";
  const nodes = workflowNodes(slug);
  const conns = connections(slug);
  // Anything that talks to a channel: blog, Facebook, LinkedIn.
  const postsExternally = nodes
    .filter((n) => n.type.endsWith(".httpRequest") && /graph\.facebook|api\.linkedin|\$json\.token|rest\/v1\/blogs/.test(String(n.parameters.url ?? "")))
    .map((n) => n.name);

  it("finds the publishing nodes it is guarding", () => {
    expect(postsExternally.length).toBeGreaterThanOrEqual(5);
  });

  it("no publishing node is reachable without the published_at claim landing", () => {
    // Walk from every trigger, but only through Claim_Landed's FALSE branch
    // (never the true one): nothing that posts may be reachable that way.
    const triggers = nodes.filter((n) => /(Trigger|\.webhook)$/.test(n.type)).map((n) => n.name);
    const seen = new Set<string>();
    const stack = [...triggers];
    while (stack.length) {
      const name = stack.pop()!;
      if (seen.has(name)) continue;
      seen.add(name);
      const outs = conns[name]?.main ?? [];
      const next = name === "Claim_Landed" ? outs.slice(1) : outs;
      for (const o of next) for (const t of o ?? []) stack.push(t.node);
    }
    expect(postsExternally.filter((n) => seen.has(n))).toEqual([]);
  });

  it("the claim only updates a row that is still unpublished", () => {
    const claim = nodes.find((n) => n.name === "Claim_Asset_For_Publish")!;
    expect(String(claim.parameters.url)).toContain("published_at=is.null");
    expect(String(claim.parameters.method)).toBe("PATCH");
  });

  it("Mark_Write_OK fails loudly on a rejected final write and passes a good one", async () => {
    await expect(
      runCodeNode(slug, "Mark_Write_OK", { input: [{ statusCode: 400, body: { message: "column missing" } }] })
    ).rejects.toThrow(/HTTP 400.*column missing/);
    await expect(runCodeNode(slug, "Mark_Write_OK", { input: [{ statusCode: 204 }] })).resolves.toHaveLength(1);
  });
});

describe("04_hero_image attaches with its own credential", () => {
  it("does not depend on a secret relayed in the request body", () => {
    const attach = workflowNodes("04_hero_image").find((n) => n.name === "Attach Hero to Asset")!;
    const headers = JSON.stringify(attach.parameters.headerParameters ?? {});
    expect(headers).not.toContain("callback_secret");
    expect(attach.parameters.authentication).toBe("genericCredentialType");
    expect(String(attach.parameters.url)).toBe("https://minions.getminions.ai/api/internal/assets/hero");
  });
});
